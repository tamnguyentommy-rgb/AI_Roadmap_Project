from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.progress import UserMastery
from app.models.curriculum import Topic
from app.models.config import LearningConfig
from app.services.sm2_service import get_due_topics

router = APIRouter()


@router.get("/{user_id}")
def get_due_reviews(user_id: int, db: Session = Depends(get_db)):
    """Trả về danh sách topic cần ôn hôm nay theo SM-2."""
    cfg = db.query(LearningConfig).filter(LearningConfig.user_id == user_id).first()
    subject_filter = cfg.subject if cfg else None

    masteries = (
        db.query(UserMastery, Topic)
        .join(Topic)
        .filter(UserMastery.user_id == user_id)
        .all()
    )

    due = get_due_topics(masteries, subject=subject_filter)

    return {
        "due_count": len(due),
        "topics": due,
        "subject": subject_filter,
        "grade": cfg.grade if cfg else None,
    }
