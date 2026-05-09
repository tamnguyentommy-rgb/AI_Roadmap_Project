from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional
import asyncio

from app.services.ml_service import ml_service
from app.services.llm_service import llm_service
from app.db.session import get_db
from app.models.user import User
from app.models.roadmap import WeeklyRoadmap
from app.models.progress import UserMastery, WeeklyProgress, LearningPath
from app.models.curriculum import Topic

router = APIRouter()

class RoadmapRequest(BaseModel):
    current_score: float = Field(..., description="Điểm hiện tại (0-10)")
    mastery_avg: float = Field(0.5)
    mastery_std: float = Field(0.1)
    weak_ratio: float = Field(0.3)
    weak_topics: list[str] = Field(default_factory=list)
    improvement_last_week: float = Field(0.0)
    prev_week_time: int = Field(120)

@router.post("/generate/{user_id}")
async def generate_roadmap(user_id: int, request: RoadmapRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User không tồn tại!")

        masteries = db.query(UserMastery).filter(UserMastery.user_id == user_id).all()
        if masteries:
            all_m = [m.mastery for m in masteries]
            avg = sum(all_m) / len(all_m)
            import numpy as np
            std = float(np.std(all_m))
            weak_count = sum(1 for m in all_m if m < 0.5)
            current_state = {
                **request.model_dump(),
                "mastery_avg": round(avg, 3),
                "mastery_std": round(std, 3),
                "weak_ratio": round(weak_count / len(all_m), 3)
            }
        else:
            current_state = request.model_dump()

        scenarios = ml_service.generate_scenarios_and_predict(current_state)
        try:
            ai_advice = await asyncio.wait_for(
                llm_service.generate_advice(current_state, scenarios),
                timeout=20.0
            )
        except (asyncio.TimeoutError, Exception):
            ai_advice = "⚠️ Routex AI đang bận, lộ trình vẫn được tạo thành công. Hãy thử lại sau để nhận lời khuyên từ AI!"

        new_roadmap = WeeklyRoadmap(
            user_id=user_id,
            start_score=request.current_score,
            ai_advice=ai_advice,
            action_details={
                "all_scenarios": scenarios,
                "entrance_weak_topics": request.weak_topics[:10],
            }
        )
        db.add(new_roadmap)
        db.commit()
        db.refresh(new_roadmap)

        user.mastery_avg = current_state.get("mastery_avg", request.mastery_avg)
        user.weak_ratio = current_state.get("weak_ratio", request.weak_ratio)
        user.current_score = request.current_score
        db.commit()

        return {
            "status": "success",
            "data": {
                "roadmap_id": new_roadmap.id,
                "scenarios": scenarios,
                "ai_advisor_message": ai_advice
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] generate_roadmap user_id={user_id}: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

async def _generate_plan_background(roadmap_id: int, chosen: dict, user_context: dict):
    """Run Gemini plan generation in the background and save to DB."""
    from app.db.session import SessionLocal
    bg_db = SessionLocal()
    try:
        print(f"[BG] Generating roadmap plan for roadmap_id={roadmap_id}...")
        plan = await llm_service.generate_roadmap_plan(chosen, user_context)
        print(f"[BG] Plan generated: error={plan.get('error')}, weeks={len(plan.get('weeks', []))}")
        rm = bg_db.query(WeeklyRoadmap).filter(WeeklyRoadmap.id == roadmap_id).first()
        if rm:
            rm.roadmap_plan = plan
            bg_db.commit()
            print(f"[BG] Saved plan to DB for roadmap_id={roadmap_id}")
    except Exception as e:
        print(f"[BG] Background plan generation error: {e}")
    finally:
        bg_db.close()

@router.post("/select/{roadmap_id}")
async def select_scenario(roadmap_id: int, scenario_name: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), duration_weeks: Optional[int] = None):
    from app.models.config import LearningConfig
    from app.models.user import User

    roadmap = db.query(WeeklyRoadmap).filter(WeeklyRoadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình!")

    roadmap.selected_scenario_name = scenario_name
    roadmap.roadmap_plan = None
    db.commit()

    scenarios = roadmap.action_details.get("all_scenarios", []) if roadmap.action_details else []
    chosen = next((s for s in scenarios if s["name"] == scenario_name), None)

    if chosen:
        user = db.query(User).filter(User.id == roadmap.user_id).first()
        cfg = db.query(LearningConfig).filter(LearningConfig.user_id == roadmap.user_id).first()
        user_context = {
            "subject": cfg.subject if cfg else "Toán",
            "grade": cfg.grade if cfg else 12,
            "current_score": roadmap.start_score or 5.0,
            "weak_ratio": user.weak_ratio if user else 0.3,
            "weak_topics": (roadmap.action_details or {}).get("entrance_weak_topics", []),
            "duration_weeks": duration_weeks if duration_weeks and duration_weeks > 0 else 4,
            "selected_topics": (cfg.selected_topics or []) if cfg else [],
        }
        background_tasks.add_task(_generate_plan_background, roadmap_id, chosen, user_context)

    return {
        "status": "generating",
        "message": f"Đã chọn: {scenario_name}! Gemini đang tạo lộ trình chi tiết...",
        "roadmap_id": roadmap_id
    }

@router.get("/plan/{roadmap_id}")
def get_roadmap_plan(roadmap_id: int, db: Session = Depends(get_db)):
    roadmap = db.query(WeeklyRoadmap).filter(WeeklyRoadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình!")
    return {
        "status": "success",
        "data": {
            "roadmap_id": roadmap.id,
            "scenario_name": roadmap.selected_scenario_name,
            "roadmap_plan": roadmap.roadmap_plan,
        }
    }

@router.get("/latest/{user_id}")
def get_latest_roadmap(user_id: int, db: Session = Depends(get_db)):
    roadmap = db.query(WeeklyRoadmap).filter(
        WeeklyRoadmap.user_id == user_id,
        WeeklyRoadmap.selected_scenario_name.isnot(None),
        WeeklyRoadmap.roadmap_plan.isnot(None)
    ).order_by(WeeklyRoadmap.id.desc()).first()

    if not roadmap:
        return {"status": "not_found", "data": None}

    return {
        "status": "success",
        "data": {
            "roadmap_id": roadmap.id,
            "scenario_name": roadmap.selected_scenario_name,
            "roadmap_plan": roadmap.roadmap_plan,
            "start_score": roadmap.start_score,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
        }
    }
