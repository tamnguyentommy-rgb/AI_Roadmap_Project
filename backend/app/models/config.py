from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class LearningConfig(Base):
    __tablename__ = "learning_configs"

    config_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    subject = Column(String, nullable=False)
    grade = Column(Integer, nullable=False)
    mode = Column(String, nullable=False)

    target_score = Column(Float, default=8.0)
    daily_study_time = Column(Float, default=60.0)
    deadline = Column(DateTime, nullable=True)
    selected_topics = Column(JSON, nullable=True)

    user = relationship("User", back_populates="config", overlaps="learning_paths,masteries,weekly_progresses")
