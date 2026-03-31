from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    pass # Lúc tạo chỉ cần username và email

class UserResponse(UserBase):
    id: int
    current_score: float
    created_at: datetime

    class Config:
        from_attributes = True # Cho phép chuyển đổi từ SQLAlchemy model sang Pydantic
