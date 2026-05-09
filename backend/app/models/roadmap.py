
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class WeeklyRoadmap(Base):
    __tablename__ = "weekly_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Lưu lại State CỦA TUẦN ĐÓ (Để AI học lại sau này)
    start_score = Column(Float)
    
    # Lộ trình học sinh đã CHỌN (Ví dụ: Chill, Cân bằng, Bứt phá)
    selected_scenario_name = Column(String)
    
    # Lưu chi tiết action dưới dạng JSON (thời gian, độ khó, số chủ đề...)
    action_details = Column(JSON)
    
    # Điểm AI dự đoán
    predicted_score = Column(Float)
    
    # Lời khuyên của Gemini (Lưu lại để tuần sau xem nó nói gì)
    ai_advice = Column(String)

    # Lộ trình chi tiết do Gemini tạo ra sau khi chọn scenario
    roadmap_plan = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
