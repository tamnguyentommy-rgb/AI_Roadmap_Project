"""
Admin endpoints — scraper control.
POST /api/admin/scrape          → trigger full scrape (background)
POST /api/admin/scrape/subject  → trigger single subject/grade
GET  /api/admin/scrape/status   → live stats
"""
import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.scraper import get_scrape_stats, run_scrape

logger = logging.getLogger(__name__)
router = APIRouter(redirect_slashes=False)

# Simple in-memory job tracker (enough for one Render instance)
_job: dict = {"running": False, "last_result": None}


def _bg_scrape(subject: Optional[str], grade: Optional[int]):
    """Background worker — runs in a thread pool via BackgroundTasks."""
    from app.db.session import SessionLocal

    _job["running"] = True
    _job["last_result"] = None
    db: Session = SessionLocal()
    try:
        result = run_scrape(db, subject=subject, grade=grade)
        _job["last_result"] = result
        logger.info("Scrape finished: %s", result)
    except Exception as e:
        _job["last_result"] = {"error": str(e)}
        logger.error("Scrape error: %s", e)
    finally:
        db.close()
        _job["running"] = False


@router.get("/scrape/status")
def scrape_status(db: Session = Depends(get_db)):
    """Return DB stats + current job status."""
    stats = get_scrape_stats(db)
    return {
        "status": "ok",
        "job_running": _job["running"],
        "last_result": _job["last_result"],
        "db_stats": stats,
    }


@router.post("/scrape")
def trigger_scrape(
    background_tasks: BackgroundTasks,
    subject: Optional[str] = Query(None, description="Filter subject e.g. Toán"),
    grade: Optional[int] = Query(None, description="Filter grade e.g. 10"),
):
    """
    Trigger a scrape job in the background.
    Provide ?subject=Toán&grade=10 to scrape only one combo, or leave empty for all.
    """
    if _job["running"]:
        return {"status": "already_running", "message": "Scraper đang chạy, vui lòng chờ."}

    background_tasks.add_task(_bg_scrape, subject, grade)
    label = f"{subject or 'tất cả'} lớp {grade or 'tất cả'}"
    return {
        "status": "started",
        "message": f"Đang scrape {label} — chạy nền, kiểm tra /status để theo dõi.",
    }


@router.post("/scrape/url")
def scrape_single_url(
    url: str = Query(..., description="VietJack URL to scrape"),
    subject: str = Query("Toán"),
    grade: int = Query(10),
    db: Session = Depends(get_db),
):
    """Scrape a single URL synchronously — useful for testing."""
    from app.services.scraper import scrape_url
    count = scrape_url(url, subject, grade, db)
    return {"status": "ok", "questions_saved": count, "url": url}
