from app.api.endpoints import roadmap, users # <--- Thêm users
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORT ROUTER (API) ---
from app.api.endpoints import roadmap

# --- IMPORT DATABASE KHU VỰC ---
from app.db.session import engine
from app.db.base import Base

# BẮT BUỘC: Import các Models để SQLAlchemy nhận diện và tạo bảng trong DB
from app.models.user import User
from app.models.roadmap import WeeklyRoadmap

# Khởi tạo Database (Lệnh này sẽ tự động đẻ ra file routex.db và các bảng nếu chưa có)
Base.metadata.create_all(bind=engine)

# --- KHỞI TẠO APP FASTAPI ---
app = FastAPI(
    title="Routex AI Backend",
    description="API lõi cho hệ thống AI Recommendation học tập (XGBoost + Gemini)",
    version="1.0.0"
)

# --- CẤU HÌNH CORS (Bảo kê cho Frontend Next.js gọi API) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Đang dev thì mở cửa cho tất cả. Sau này lên production thì điền domain thật vào đây.
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép mọi phương thức (GET, POST, PUT, DELETE...)
    allow_headers=["*"],  # Cho phép mọi loại Headers
)

# --- CẮM CÁC DÂY API VÀO SERVER ---
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Roadmap AI"])

# --- API ROOT (Dùng để test xem Server có đang sống không) ---
@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "success",
        "message": "🚀 Routex Backend is running smoothly!",
        "database": "Connected"
    }
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Roadmap AI"])
app.include_router(users.router, prefix="/api/users", tags=["Users"]) # <--- Thêm dòng này
