from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.db.base_class import Base


class ScrapedURL(Base):
    """Tracks which VietJack pages have been scraped to avoid re-crawling."""
    __tablename__ = "scraped_urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, nullable=False, index=True)
    subject = Column(String, nullable=True)
    grade = Column(Integer, nullable=True)
    topic_name = Column(String, nullable=True)
    question_count = Column(Integer, default=0)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=True)
    error_msg = Column(String, nullable=True)
