from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class UserMastery(Base):
    __tablename__ = "user_mastery"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), primary_key=True)
    mastery = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    # Lần cuối user thực sự ôn chủ đề này (để tính time decay)
    last_reviewed = Column(DateTime, default=datetime.utcnow, nullable=True)

    # SM-2 Spaced Repetition fields
    next_review_date = Column(DateTime, nullable=True)
    sm2_interval = Column(Integer, default=1)
    sm2_easiness = Column(Float, default=2.5)
    sm2_repetitions = Column(Integer, default=0)

    user = relationship("User", back_populates="masteries")
    topic = relationship("Topic", back_populates="masteries")

class WeeklyProgress(Base):
    __tablename__ = "weekly_progress"

    progress_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    week = Column(Integer, nullable=False)
    
    study_time = Column(Float, default=0.0)
    score = Column(Float, default=0.0)

    user = relationship("User", back_populates="weekly_progresses")

class LearningPath(Base):
    __tablename__ = "learning_paths"

    path_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    week = Column(Integer, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    status = Column(String, default="pending") # pending hoặc done

    user = relationship("User", back_populates="learning_paths")
