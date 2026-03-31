
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    
    # State hiện tại của User (Bản snapshot mới nhất)
    current_score = Column(Float, default=0.0)
    mastery_avg = Column(Float, default=0.0)
    weak_ratio = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
