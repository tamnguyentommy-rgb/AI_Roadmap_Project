from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    grade = Column(Integer, nullable=True)

    current_score = Column(Float, default=0.0)
    mastery_avg = Column(Float, default=0.0)
    weak_ratio = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    avatar_data = Column(Text, nullable=True)
    mascot_name = Column(String, nullable=True)
    mascot_personality = Column(String, nullable=True)

    config = relationship("LearningConfig", back_populates="user", uselist=False)
    masteries = relationship("UserMastery", back_populates="user")
    weekly_progresses = relationship("WeeklyProgress", back_populates="user")
    learning_paths = relationship("LearningPath", back_populates="user")
