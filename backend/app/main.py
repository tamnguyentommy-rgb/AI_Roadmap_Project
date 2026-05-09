import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.db.session import engine
from app.db.base import Base

from app.api.endpoints import users, roadmap, tests, auth, config, dashboard, chat, review, admin
from app.models import scraper as scraper_models  # ensure table created

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Routex AI Backend",
    description="API lõi cho hệ thống AI Recommendation học tập",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(tests.router, prefix="/api/tests", tags=["Tests"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Roadmap"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(review.router, prefix="/api/review", tags=["Review"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "message": "Routex AI v2 is running!"}

@app.get("/", tags=["Health"])
def root():
    dev_domain = os.getenv("REPLIT_DEV_DOMAIN", "")
    if dev_domain:
        return RedirectResponse(url=f"https://{dev_domain}:5000")
    return RedirectResponse(url="http://localhost:5000")
