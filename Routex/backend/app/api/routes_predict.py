from fastapi import APIRouter, HTTPException
from app.services.ai_service import ai_engine

router = APIRouter()

@router.post("/predict-roadmap")
async def predict_roadmap(user_input: dict):
    """
    Nhận dữ liệu user và trả về lộ trình học
    """
    mode = user_input.get("mode", "general")
    try:
        roadmap = ai_engine.get_recommendation(user_input, mode=mode)
        return {
            "status": "success",
            "mode": mode,
            "roadmap": roadmap
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
