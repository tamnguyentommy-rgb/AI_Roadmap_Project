import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.config import LearningConfig
from app.models.user import User
from app.schemas.config import ConfigCreate, ConfigResponse

router = APIRouter()

SUBJECT_MAP = {
    "Toán": "Toán",
    "Lý": "Vật lí",
    "Hóa": "Hóa học",
    "Sinh": "Sinh học",
}

_CURRICULUM_CACHE: dict | None = None

def _load_curriculum() -> dict:
    global _CURRICULUM_CACHE
    if _CURRICULUM_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), "../../../data/curriculum_topics.json")
        with open(os.path.abspath(path), encoding="utf-8") as f:
            _CURRICULUM_CACHE = json.load(f)
    return _CURRICULUM_CACHE


@router.get("/curriculum/{subject}/{grade}")
def get_curriculum(subject: str, grade: int):
    curriculum = _load_curriculum()
    json_subject = SUBJECT_MAP.get(subject, subject)
    grade_str = str(grade)
    if json_subject not in curriculum:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy môn: {subject}")
    if grade_str not in curriculum[json_subject]:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy lớp {grade} cho môn {subject}")
    chapters = curriculum[json_subject][grade_str]
    return {"subject": subject, "grade": grade, "chapters": chapters}


@router.post("/{user_id}", response_model=ConfigResponse)
def save_config(user_id: int, config: ConfigCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")

    existing = db.query(LearningConfig).filter(LearningConfig.user_id == user_id).first()
    if existing:
        for k, v in config.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    new_config = LearningConfig(user_id=user_id, **config.model_dump())
    db.add(new_config)

    user.grade = config.grade
    db.commit()
    db.refresh(new_config)
    return new_config


@router.get("/{user_id}", response_model=ConfigResponse)
def get_config(user_id: int, db: Session = Depends(get_db)):
    cfg = db.query(LearningConfig).filter(LearningConfig.user_id == user_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Chưa có config!")
    return cfg
