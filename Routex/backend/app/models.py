
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

# 1. BẢNG TĨNH: Curriculum Graph (Sơ đồ kỹ năng)
class Topic(Base):
    __tablename__ = "topics"
    id = Column(String, primary_key=True, index=True) # VD: MATH_12_01
    subject = Column(String, index=True)
    grade = Column(Integer)
    name = Column(String)
    difficulty = Column(Integer)
    prerequisite_id = Column(String, nullable=True) # ID của topic cần học trước

# 2. BẢNG ĐỘNG: User Profile & Config
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    grade = Column(Integer)
    target_score = Column(Float)
    daily_study_time = Column(Integer) # Phút

# 3. BẢNG ĐỘNG (CỐT LÕI): User Skill State (Trạng thái kỹ năng hiện tại)
class UserSkillState(Base):
    __tablename__ = "user_skill_states"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    topic_id = Column(String, ForeignKey("topics.id"))
    mastery = Column(Float, default=0.0) # 0.0 -> 1.0
    last_updated = Column(DateTime, default=datetime.utcnow)

# 4. BẢNG ĐỘNG: Weekly Progress (Lịch sử học hàng tuần - Feed cho ML)
class WeeklyProgress(Base):
    __tablename__ = "weekly_progress"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    week_no = Column(Integer)
    study_time_mins = Column(Integer) # Thời gian thực học
    test_score = Column(Float) # Điểm cuối tuần
