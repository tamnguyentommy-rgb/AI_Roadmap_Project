
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Dùng SQLite cho nhẹ nhàng lúc dev. Nó sẽ đẻ ra file routex.db ngay trong thư mục backend
SQLALCHEMY_DATABASE_URL = "sqlite:///./routex.db"
# Nếu sau này xài PostgreSQL, mày chỉ cần đổi URL thành:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/routex_db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} # Dòng này chỉ bắt buộc cho SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Hàm này để nhúng vào FastAPI, mỗi khi có Request tới nó mở 1 Session, xong việc thì đóng lại
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
