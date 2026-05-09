from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

class AvatarUpload(BaseModel):
    avatar_data: str

class MascotUpdate(BaseModel):
    mascot_name: str
    mascot_personality: str  # "serious" | "funny" | "coach"

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")
    return user

@router.post("/{user_id}/avatar")
def upload_avatar(user_id: int, payload: AvatarUpload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")
    user.avatar_data = payload.avatar_data
    db.commit()
    return {"status": "ok"}

@router.get("/{user_id}/avatar")
def get_avatar(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")
    return {"avatar_data": user.avatar_data or ""}

@router.get("/{user_id}/mascot")
def get_mascot(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")
    return {
        "mascot_name": user.mascot_name or "",
        "mascot_personality": user.mascot_personality or "coach",
    }

@router.post("/{user_id}/mascot")
def save_mascot(user_id: int, payload: MascotUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")
    user.mascot_name = payload.mascot_name.strip()
    user.mascot_personality = payload.mascot_personality
    db.commit()
    return {"status": "ok", "mascot_name": user.mascot_name, "mascot_personality": user.mascot_personality}
