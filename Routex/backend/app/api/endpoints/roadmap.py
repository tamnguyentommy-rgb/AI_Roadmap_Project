from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Import Services (Não ML + Miệng LLM)
from app.services.ml_service import ml_service
from app.services.llm_service import llm_service

# Import DB & Models (Trí nhớ)
from app.db.session import get_db
from app.models.user import User
from app.models.roadmap import WeeklyRoadmap

# Khởi tạo Router cho API
router = APIRouter()

# ==========================================
# 1. ĐỊNH NGHĨA SCHEMA (Khuôn mẫu dữ liệu nhận từ Frontend)
# ==========================================
class RoadmapRequest(BaseModel):
    current_score: float = Field(..., description="Điểm hiện tại của học sinh (0-10)")
    mastery_avg: float = Field(..., description="Độ thông thạo trung bình (0-1)")
    mastery_std: float = Field(..., description="Độ lệch chuẩn của thông thạo")
    weak_ratio: float = Field(..., description="Tỷ lệ chủ đề bị hổng (0-1)")
    improvement_last_week: float = Field(..., description="Điểm tăng so với tuần trước")
    prev_week_time: int = Field(..., description="Thời gian học tuần trước (phút)")

# ==========================================
# 2. ENDPOINT TẠO VÀ LƯU LỘ TRÌNH: POST /api/roadmap/generate/{user_id}
# ==========================================
@router.post("/generate/{user_id}", summary="Tạo kịch bản học tập và lưu vào Database")
async def generate_roadmap(user_id: int, request: RoadmapRequest, db: Session = Depends(get_db)):
    try:
        # 0. Kiểm tra xem User này có thật trong Database không
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User không tồn tại trong Database. Hãy tạo user trước!")

        # 1. Biến Request của Frontend thành Dictionary
        current_state = request.model_dump()

        # 2. BƯỚC 1: Gọi ML đẻ 3 kịch bản
        scenarios = ml_service.generate_scenarios_and_predict(current_state)
        if not scenarios:
            raise HTTPException(status_code=500, detail="Lỗi: Không thể chạy mô hình ML.")

        # 3. BƯỚC 2: Gọi Gemini sinh lời khuyên
        ai_advice = await llm_service.generate_advice(current_state, scenarios)

        # 4. BƯỚC 3: LƯU VÀO DATABASE
        # Lưu lại bản nháp (vì học sinh chưa bấm chọn lộ trình nào)
        new_history = WeeklyRoadmap(
            user_id=user_id,
            start_score=request.current_score,
            ai_advice=ai_advice,
            action_details={"all_scenarios": scenarios} # Lưu nguyên cục JSON 3 kịch bản vào DB
        )
        db.add(new_history)
        db.commit()
        db.refresh(new_history) # Refresh để lấy được cái ID vừa tạo

        # 5. TRẢ KẾT QUẢ VỀ CHO FRONTEND (Kèm theo roadmap_id)
        return {
            "status": "success",
            "message": "Đã tạo lộ trình thành công",
            "data": {
                "roadmap_id": new_history.id, # Quan trọng: Phải nhả ID về để lát Frontend biết đường gọi API Chọn
                "scenarios": scenarios,
                "ai_advisor_message": ai_advice
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống Routex: {str(e)}")


# ==========================================
# 3. ENDPOINT CHỌN LỘ TRÌNH: POST /api/roadmap/select/{roadmap_id}
# ==========================================
@router.post("/select/{roadmap_id}", summary="Lưu lại kịch bản học sinh đã chọn")
def select_scenario(roadmap_id: int, scenario_name: str, db: Session = Depends(get_db)):
    # 1. Tìm cái Roadmap nháp vừa tạo ở bước trên
    roadmap = db.query(WeeklyRoadmap).filter(WeeklyRoadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình này trong hệ thống")
    
    # 2. Cập nhật tên lộ trình mà học sinh vừa chốt
    roadmap.selected_scenario_name = scenario_name
    db.commit()
    
    return {
        "status": "success",
        "message": f"Bạn đã chốt: {scenario_name}. Chúc bạn học tốt!"
    }
