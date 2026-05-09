"""
VietJack Scraper Service
========================
Crawls trắc nghiệm pages from vietjack.com for Toán / Lý / Hóa / Sinh, lớp 10–12.
Saves parsed MCQ questions to the DB. Already-scraped URLs are skipped.
LLM is used as fallback only when the answer is missing from HTML.
"""
import asyncio
import hashlib
import logging
import re
import time
import unicodedata
from typing import Optional

import httpx
from bs4 import BeautifulSoup, Tag
from sqlalchemy.orm import Session

from app.models.assessment import Question
from app.models.curriculum import Topic
from app.models.scraper import ScrapedURL

logger = logging.getLogger(__name__)

# ── HTTP settings ─────────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://vietjack.com/",
}
REQUEST_DELAY = 1.5   # seconds between requests
REQUEST_TIMEOUT = 20  # seconds

# ── URL catalog ───────────────────────────────────────────────────────────────
# Each entry: subject, grade, base URL of the index page listing all topic links.
INDEX_CATALOG: list[dict] = [
    # Toán lớp 10
    {"subject": "Toán", "grade": 10,
     "url": "https://vietjack.com/toan-10-kn/trac-nghiem-toan-lop-10-ket-noi.jsp"},
    {"subject": "Toán", "grade": 10,
     "url": "https://vietjack.com/toan-10-cd/trac-nghiem-toan-lop-10-canh-dieu.jsp"},
    {"subject": "Toán", "grade": 10,
     "url": "https://vietjack.com/toan-10-ct/trac-nghiem-toan-lop-10-chan-troi.jsp"},
    # Toán lớp 11
    {"subject": "Toán", "grade": 11,
     "url": "https://vietjack.com/toan-11-kn/trac-nghiem-toan-11-ket-noi.jsp"},
    {"subject": "Toán", "grade": 11,
     "url": "https://vietjack.com/toan-11-ct/trac-nghiem-toan-11-chan-troi.jsp"},
    {"subject": "Toán", "grade": 11,
     "url": "https://vietjack.com/toan-11-cd/trac-nghiem-toan-11-canh-dieu.jsp"},
    # Toán lớp 12
    {"subject": "Toán", "grade": 12,
     "url": "https://vietjack.com/toan-12-kn/trac-nghiem-toan-lop-12.jsp"},
    {"subject": "Toán", "grade": 12,
     "url": "https://vietjack.com/toan-12-ct/trac-nghiem-toan-lop-12.jsp"},
    {"subject": "Toán", "grade": 12,
     "url": "https://vietjack.com/toan-12-cd/trac-nghiem-toan-lop-12.jsp"},
    # Vật Lý
    {"subject": "Lý", "grade": 10,
     "url": "https://vietjack.com/bai-tap-trac-nghiem-vat-li-10/index.jsp"},
    {"subject": "Lý", "grade": 11,
     "url": "https://vietjack.com/bai-tap-trac-nghiem-vat-li-11/index.jsp"},
    {"subject": "Lý", "grade": 12,
     "url": "https://vietjack.com/bai-tap-trac-nghiem-vat-li-12/index.jsp"},
    # Hóa học
    {"subject": "Hóa", "grade": 10,
     "url": "https://vietjack.com/hoa-hoc-10-kn/trac-nghiem-hoa-hoc-lop-10-ket-noi.jsp"},
    {"subject": "Hóa", "grade": 11,
     "url": "https://vietjack.com/hoa-hoc-11-kn/trac-nghiem-hoa-hoc-lop-11-ket-noi.jsp"},
    {"subject": "Hóa", "grade": 12,
     "url": "https://vietjack.com/hoa-hoc-12-kn/trac-nghiem-hoa-hoc-lop-12-ket-noi.jsp"},
    # Sinh học
    {"subject": "Sinh", "grade": 10,
     "url": "https://vietjack.com/sinh-10-kn/trac-nghiem-sinh-hoc-lop-10-ket-noi.jsp"},
    {"subject": "Sinh", "grade": 11,
     "url": "https://vietjack.com/sinh-11-kn/trac-nghiem-sinh-hoc-lop-11-ket-noi.jsp"},
    {"subject": "Sinh", "grade": 12,
     "url": "https://vietjack.com/bai-tap-trac-nghiem-sinh-hoc-12/index.jsp"},
]

# Pattern to recognise topic-level quiz URLs (not chapter/book index pages)
_TOPIC_URL_RE = re.compile(
    r"/(trac-nghiem-bai-\d*[-\w]*"
    r"|100-cau-trac-nghiem-[-\w]+"
    r"|trac-nghiem-[-\w]+-lop-\d+[-\w]*"
    r"|trac-nghiem-[-\w]+)"
    r"\.jsp$",
    re.IGNORECASE,
)


def _normalize(text: str) -> str:
    """Collapse whitespace and strip."""
    return re.sub(r"\s+", " ", text).strip()


def _content_hash(content: str) -> str:
    return hashlib.md5(content.encode("utf-8")).hexdigest()


def _slug_to_topic(url: str) -> str:
    """
    Convert a VietJack URL slug to a readable Vietnamese topic name.
    e.g. trac-nghiem-bai-1-menh-de.jsp → Mệnh đề
    """
    slug = url.rstrip("/").split("/")[-1].replace(".jsp", "")
    # Remove common prefixes
    for prefix in [
        r"^trac-nghiem-bai-\d+-",
        r"^100-cau-trac-nghiem-",
        r"^trac-nghiem-chuong-\d+-",
        r"^trac-nghiem-",
    ]:
        slug = re.sub(prefix, "", slug)

    # Replace hyphens with spaces and title-case
    words = slug.replace("-", " ").strip()
    return words.title() if words else slug


# ── HTML Parser ───────────────────────────────────────────────────────────────

def _parse_questions_from_html(html: str) -> list[dict]:
    """
    Extract MCQ questions from a VietJack trắc nghiệm page.

    Expected HTML per question:
      <p><strong>Câu N. </strong>Content?</p>
      <p><strong>A.</strong> Option A</p>
      ...
      <p><strong>D.</strong> Option D</p>
      <section class="toggle">
        <div class="toggle-content">
          <p><strong>Đáp án đúng là: B</strong></p>
          <p>Explanation text</p>
        </div>
      </section>
    """
    soup = BeautifulSoup(html, "lxml")

    # Remove noise: ads, scripts, nav
    for tag in soup(["script", "style", "nav", "header", "footer", "noscript"]):
        tag.decompose()

    results: list[dict] = []

    # All <p> tags that start a question (contain "Câu N.")
    cau_re = re.compile(r"^Câu\s+\d+[.:]?\s*", re.IGNORECASE)
    ans_letter_re = re.compile(r"Đáp án đúng là\s*[:\-]?\s*([A-D])", re.IGNORECASE)
    opt_re = re.compile(r"^([A-D])\s*[.)]")

    all_p = soup.find_all("p")
    i = 0
    while i < len(all_p):
        p = all_p[i]
        text = _normalize(p.get_text())

        if not cau_re.match(text):
            i += 1
            continue

        # Extract question content (remove "Câu N. " prefix)
        q_content = cau_re.sub("", text).strip()
        if not q_content:
            i += 1
            continue

        # Collect following <p> tags as options A-D
        options: dict[str, str] = {}
        j = i + 1
        while j < len(all_p) and len(options) < 4:
            op_text = _normalize(all_p[j].get_text())
            m = opt_re.match(op_text)
            if m:
                letter = m.group(1).upper()
                opt_text = op_text[m.end():].strip()
                options[letter] = opt_text
                j += 1
            else:
                # Could be multiline question continuation before options start
                if not options:
                    q_content += " " + op_text
                    j += 1
                else:
                    break

        if len(options) < 4:
            i = j
            continue

        # Find the nearest <section class="toggle"> after current position
        correct_answer: Optional[str] = None
        explanation = ""

        # Search in the soup tree for toggle-content near this question
        # Walk siblings/parents to find the toggle section
        node = p
        for _ in range(20):
            node = node.find_next_sibling()
            if node is None:
                break
            if isinstance(node, Tag) and node.name == "section" and "toggle" in node.get("class", []):
                tc = node.find("div", class_="toggle-content")
                if tc:
                    tc_text = tc.get_text()
                    m2 = ans_letter_re.search(tc_text)
                    if m2:
                        correct_answer = m2.group(1).upper()
                    # Explanation = everything after the answer line
                    paras = tc.find_all("p")
                    exp_parts = []
                    for pp in paras:
                        pt = _normalize(pp.get_text())
                        if ans_letter_re.search(pt):
                            continue
                        if pt:
                            exp_parts.append(pt)
                    explanation = " ".join(exp_parts)
                break
            # Stop if we hit the next question
            if isinstance(node, Tag) and cau_re.match(_normalize(node.get_text())):
                break

        results.append({
            "content": q_content,
            "A": options.get("A", ""),
            "B": options.get("B", ""),
            "C": options.get("C", ""),
            "D": options.get("D", ""),
            "correct": correct_answer,
            "explanation": explanation,
        })
        i = j

    return results


# ── Topic finder / creator ────────────────────────────────────────────────────

def _get_or_create_topic(db: Session, subject: str, grade: int, name: str) -> Topic:
    t = (
        db.query(Topic)
        .filter(Topic.subject == subject, Topic.grade == grade, Topic.name == name)
        .first()
    )
    if not t:
        t = Topic(subject=subject, grade=grade, name=name, description="")
        db.add(t)
        db.flush()
    return t


# ── Core scrape functions ─────────────────────────────────────────────────────

def _fetch(url: str) -> Optional[str]:
    """Synchronous HTTP fetch with retry."""
    for attempt in range(3):
        try:
            with httpx.Client(headers=HEADERS, timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    return resp.text
                logger.warning("HTTP %s for %s", resp.status_code, url)
                return None
        except Exception as e:
            logger.warning("Fetch attempt %d failed for %s: %s", attempt + 1, url, e)
            time.sleep(2)
    return None


def _discover_topic_urls(index_url: str) -> list[str]:
    """Fetch an index page and return all topic quiz URLs found."""
    html = _fetch(index_url)
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    base = "/".join(index_url.rstrip("/").split("/")[:-1]) + "/"

    urls: list[str] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        if not href or href.startswith("#"):
            continue
        # Make absolute
        if href.startswith("http"):
            abs_url = href
        elif href.startswith("../"):
            # Relative parent — resolve against vietjack.com
            abs_url = "https://vietjack.com/" + href.lstrip("../")
        else:
            abs_url = base + href.lstrip("/")

        if abs_url in seen:
            continue
        if _TOPIC_URL_RE.search(abs_url):
            seen.add(abs_url)
            urls.append(abs_url)

    return urls


def scrape_url(
    url: str,
    subject: str,
    grade: int,
    db: Session,
    llm_fallback_fn=None,
) -> int:
    """
    Scrape a single topic URL, save questions to DB.
    Returns number of questions saved.
    """
    # Skip already-scraped
    existing = db.query(ScrapedURL).filter(ScrapedURL.url == url).first()
    if existing and existing.success:
        logger.info("Skip already-scraped: %s", url)
        return 0

    topic_name = _slug_to_topic(url)
    logger.info("Scraping [%s Lớp %d] %s → %s", subject, grade, url, topic_name)

    html = _fetch(url)
    if not html:
        _record_url(db, url, subject, grade, topic_name, 0, False, "HTTP fetch failed")
        return 0

    parsed = _parse_questions_from_html(html)
    if not parsed:
        _record_url(db, url, subject, grade, topic_name, 0, False, "No questions parsed")
        return 0

    topic = _get_or_create_topic(db, subject, grade, topic_name)
    saved = 0

    for qd in parsed:
        content = qd.get("content", "").strip()
        if not content:
            continue

        # Dedup by content hash
        h = _content_hash(content)
        dupe = (
            db.query(Question)
            .filter(Question.topic_id == topic.id, Question.content == content)
            .first()
        )
        if dupe:
            continue

        correct = (qd.get("correct") or "").strip().upper()
        # LLM fallback when answer not found in HTML
        if correct not in ("A", "B", "C", "D") and llm_fallback_fn:
            try:
                correct = llm_fallback_fn(content, qd)
            except Exception:
                correct = "A"

        if correct not in ("A", "B", "C", "D"):
            correct = "A"  # last resort default

        q = Question(
            topic_id=topic.id,
            content=content,
            option_a=qd.get("A", "").strip(),
            option_b=qd.get("B", "").strip(),
            option_c=qd.get("C", "").strip(),
            option_d=qd.get("D", "").strip(),
            correct_answer=correct,
            explanation=(qd.get("explanation") or "").strip()[:1000],
            difficulty=0.5,
        )
        db.add(q)
        saved += 1

    db.flush()
    _record_url(db, url, subject, grade, topic_name, saved, True, None)
    db.commit()
    logger.info("  → Saved %d new questions", saved)
    return saved


def _record_url(
    db: Session,
    url: str,
    subject: str,
    grade: int,
    topic_name: str,
    count: int,
    success: bool,
    error: Optional[str],
):
    rec = db.query(ScrapedURL).filter(ScrapedURL.url == url).first()
    if rec:
        rec.question_count = count
        rec.success = success
        rec.error_msg = error
        from datetime import datetime
        rec.scraped_at = datetime.utcnow()
    else:
        from datetime import datetime
        db.add(ScrapedURL(
            url=url,
            subject=subject,
            grade=grade,
            topic_name=topic_name,
            question_count=count,
            success=success,
            error_msg=error,
            scraped_at=datetime.utcnow(),
        ))


# ── Public API ────────────────────────────────────────────────────────────────

def run_scrape(
    db: Session,
    subject: Optional[str] = None,
    grade: Optional[int] = None,
    llm_fallback_fn=None,
    delay: float = REQUEST_DELAY,
) -> dict:
    """
    Main entry point.  Discovers topic URLs from index pages, then scrapes each.
    Skips already-scraped URLs automatically.

    Args:
        subject: filter to a specific subject (None = all)
        grade:   filter to a specific grade (None = all)
        llm_fallback_fn: async or sync callable(content, qd) → correct letter
        delay: seconds to wait between HTTP requests
    Returns:
        summary dict with counts
    """
    catalog = [
        c for c in INDEX_CATALOG
        if (subject is None or c["subject"] == subject)
        and (grade is None or c["grade"] == grade)
    ]

    total_urls = 0
    total_questions = 0
    total_skipped = 0
    errors: list[str] = []

    for entry in catalog:
        idx_url = entry["url"]
        subj = entry["subject"]
        gr = entry["grade"]

        logger.info("Discovering topic URLs from index: %s", idx_url)
        topic_urls = _discover_topic_urls(idx_url)
        logger.info("  Found %d topic URLs", len(topic_urls))
        time.sleep(delay)

        for t_url in topic_urls:
            total_urls += 1
            # Check already done
            existing = db.query(ScrapedURL).filter(ScrapedURL.url == t_url).first()
            if existing and existing.success:
                total_skipped += 1
                continue

            try:
                count = scrape_url(t_url, subj, gr, db, llm_fallback_fn)
                total_questions += count
            except Exception as e:
                logger.error("Error scraping %s: %s", t_url, e)
                errors.append(f"{t_url}: {e}")

            time.sleep(delay)

    return {
        "index_pages_crawled": len(catalog),
        "topic_urls_found": total_urls,
        "topic_urls_skipped": total_skipped,
        "questions_saved": total_questions,
        "errors": errors[:20],
    }


def get_scrape_stats(db: Session) -> dict:
    """Return current DB stats for the scraper."""
    total_scraped = db.query(ScrapedURL).count()
    success_count = db.query(ScrapedURL).filter(ScrapedURL.success == True).count()  # noqa
    q_count = db.query(Question).count()

    # Breakdown by subject
    from sqlalchemy import func
    breakdown = (
        db.query(ScrapedURL.subject, ScrapedURL.grade, func.count(), func.sum(ScrapedURL.question_count))
        .group_by(ScrapedURL.subject, ScrapedURL.grade)
        .all()
    )

    return {
        "scraped_urls_total": total_scraped,
        "scraped_urls_success": success_count,
        "total_questions_in_db": q_count,
        "by_subject_grade": [
            {"subject": r[0], "grade": r[1], "urls": r[2], "questions": int(r[3] or 0)}
            for r in breakdown
        ],
    }
