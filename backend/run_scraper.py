"""
Standalone runner for the VietJack scraper.
Usage:
  cd backend
  python run_scraper.py                    # scrape all
  python run_scraper.py Toán 10            # scrape Toán lớp 10 only
  python run_scraper.py Lý                 # scrape Lý all grades
"""
import sys
import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

# Import all models first so SQLAlchemy relationships resolve
from app.db.base import Base   # noqa: F401 — side-effect import
from app.db.session import SessionLocal, engine

# Ensure tables exist
Base.metadata.create_all(bind=engine)

from app.services.scraper import run_scrape, get_scrape_stats  # noqa: E402

subject = sys.argv[1] if len(sys.argv) > 1 else None
grade   = int(sys.argv[2]) if len(sys.argv) > 2 else None

db = SessionLocal()
try:
    print(f"\n🚀 Starting scrape — subject={subject or 'all'}, grade={grade or 'all'}\n")
    result = run_scrape(db, subject=subject, grade=grade)
    print("\n✅ Scrape complete:", result)
    print("\n📊 DB Stats:", get_scrape_stats(db))
finally:
    db.close()
