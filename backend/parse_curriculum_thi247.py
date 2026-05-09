"""
Thi247 Curriculum Parser
========================
Crawls thi247.com SGK pages for 4 subjects × 3 grades × 2 textbook series,
parses chapters + lessons, deduplicates across series, and writes to:
  backend/data/curriculum_topics.json

Page structure variants observed:
  A) Plain-text TOC in a <p> with <br/> between lines (most subjects)
  B) <strong>Chapter</strong><br/>lesson<br/>... pattern (e.g. Vật lí 11 KN)
  C) Lessons have NO "Bài X." prefix — just plain names after the chapter
  D) Toán pages use Elementor builder with no TOC — handled via manual fallback

Chapter lines: start with "Chương" + Arabic or Roman numeral
Section lines: start with "Phần" — ignored (not chapters, not lessons)
Lesson lines: everything else inside a chapter context
Skip: lines containing "Thực hành", "Ôn tập", "Bài tập"
Junk:  "Hướng dẫn", "Lời nói đầu", "Bảng đơn vị", "Giải thích một số"

Usage:
  cd backend
  python parse_curriculum_thi247.py
"""

import json
import re
import time
import unicodedata
import logging
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8",
}
REQUEST_DELAY = 1.5
OUTPUT_FILE = Path(__file__).parent / "data" / "curriculum_topics.json"

SKIP_KEYWORDS = ["Thực hành", "Ôn tập", "Bài tập"]

JUNK_PREFIXES = [
    "Hướng dẫn sử dụng",
    "Lời nói đầu",
    "Bảng đơn vị",
    "Giải thích một số",
    "THI247",
    "[ads]",
    "Mục lục",
    "Lời tựa",
]

# 4 subjects × 3 grades × 2 series = 24 URLs
# Note: Toán pages on thi247 use Elementor builder with no TOC —
#       those entries are fetched but will return empty; manual data is provided below.
CATALOG = [
    # ── Hóa học ──────────────────────────────────────────────────────────────
    {"subject": "Hóa học", "grade": 10, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-10-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Hóa học", "grade": 10, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-10-chan-troi-sang-tao/"},
    {"subject": "Hóa học", "grade": 11, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-11-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Hóa học", "grade": 11, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-11-chan-troi-sang-tao/"},
    {"subject": "Hóa học", "grade": 12, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-12-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Hóa học", "grade": 12, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-hoa-hoc-12-chan-troi-sang-tao/"},
    # ── Vật lí ───────────────────────────────────────────────────────────────
    {"subject": "Vật lí", "grade": 10, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-10-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Vật lí", "grade": 10, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-10-chan-troi-sang-tao/"},
    {"subject": "Vật lí", "grade": 11, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-11-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Vật lí", "grade": 11, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-11-chan-troi-sang-tao/"},
    {"subject": "Vật lí", "grade": 12, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-12-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Vật lí", "grade": 12, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-vat-li-12-chan-troi-sang-tao/"},
    # ── Toán — thi247 has no TOC for these; fallback data used ───────────────
    {"subject": "Toán", "grade": 10, "series": "Kết nối tri thức", "url": None},
    {"subject": "Toán", "grade": 10, "series": "Chân trời sáng tạo", "url": None},
    {"subject": "Toán", "grade": 11, "series": "Kết nối tri thức", "url": None},
    {"subject": "Toán", "grade": 11, "series": "Chân trời sáng tạo", "url": None},
    {"subject": "Toán", "grade": 12, "series": "Kết nối tri thức", "url": None},
    {"subject": "Toán", "grade": 12, "series": "Chân trời sáng tạo", "url": None},
    # ── Sinh học ─────────────────────────────────────────────────────────────
    {"subject": "Sinh học", "grade": 10, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-10-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Sinh học", "grade": 10, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-10-chan-troi-sang-tao/"},
    {"subject": "Sinh học", "grade": 11, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-11-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Sinh học", "grade": 11, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-11-chan-troi-sang-tao/"},
    {"subject": "Sinh học", "grade": 12, "series": "Kết nối tri thức",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-12-ket-noi-tri-thuc-voi-cuoc-song/"},
    {"subject": "Sinh học", "grade": 12, "series": "Chân trời sáng tạo",
     "url": "https://thi247.com/sach-giao-khoa-sinh-hoc-12-chan-troi-sang-tao/"},
]

# ── Manual fallback for Toán (thi247 has no TOC pages) ────────────────────────
# Source: SGK Toán 2018 chương trình mới (Kết nối tri thức / Chân trời sáng tạo)
TOAN_FALLBACK = {
    10: [
        {"chapter": "Mệnh đề và tập hợp",
         "lessons": ["Mệnh đề", "Tập hợp", "Các phép toán tập hợp", "Các tập hợp số"]},
        {"chapter": "Bất phương trình và hệ bất phương trình bậc nhất hai ẩn",
         "lessons": ["Bất đẳng thức", "Bất phương trình bậc nhất hai ẩn", "Hệ bất phương trình bậc nhất hai ẩn"]},
        {"chapter": "Hệ thức lượng trong tam giác",
         "lessons": ["Giá trị lượng giác của góc từ 0° đến 180°", "Định lý cosin và định lý sin",
                     "Giải tam giác và ứng dụng thực tế", "Công thức diện tích tam giác"]},
        {"chapter": "Vectơ",
         "lessons": ["Khái niệm vectơ", "Tổng và hiệu hai vectơ", "Tích của vectơ với một số",
                     "Tích vô hướng của hai vectơ"]},
        {"chapter": "Phương pháp tọa độ trong mặt phẳng",
         "lessons": ["Hệ trục tọa độ", "Phương trình đường thẳng", "Vị trí tương đối hai đường thẳng",
                     "Khoảng cách từ điểm đến đường thẳng", "Đường tròn"]},
        {"chapter": "Hàm số và đồ thị",
         "lessons": ["Hàm số", "Hàm số bậc hai", "Đồ thị hàm số bậc hai và ứng dụng"]},
        {"chapter": "Xác suất",
         "lessons": ["Phép thử ngẫu nhiên và không gian mẫu", "Biến cố", "Xác suất của biến cố",
                     "Xác suất có điều kiện", "Công thức xác suất toàn phần và Bayes"]},
        {"chapter": "Thống kê",
         "lessons": ["Số liệu thống kê", "Các số đặc trưng của mẫu số liệu không ghép nhóm",
                     "Các số đặc trưng của mẫu số liệu ghép nhóm"]},
    ],
    11: [
        {"chapter": "Hàm số lượng giác và phương trình lượng giác",
         "lessons": ["Góc lượng giác và đo góc lượng giác", "Giá trị lượng giác", "Hàm số lượng giác",
                     "Phương trình lượng giác cơ bản", "Phương trình lượng giác thường gặp"]},
        {"chapter": "Dãy số. Cấp số cộng và cấp số nhân",
         "lessons": ["Dãy số", "Cấp số cộng", "Cấp số nhân"]},
        {"chapter": "Giới hạn",
         "lessons": ["Giới hạn của dãy số", "Giới hạn của hàm số", "Hàm số liên tục"]},
        {"chapter": "Đạo hàm",
         "lessons": ["Định nghĩa đạo hàm", "Ý nghĩa của đạo hàm", "Các quy tắc tính đạo hàm",
                     "Đạo hàm của hàm số lượng giác", "Đạo hàm cấp hai"]},
        {"chapter": "Quan hệ vuông góc trong không gian",
         "lessons": ["Đường thẳng vuông góc với mặt phẳng", "Hai mặt phẳng vuông góc",
                     "Khoảng cách trong không gian"]},
        {"chapter": "Phương pháp tọa độ trong không gian",
         "lessons": ["Hệ trục tọa độ trong không gian", "Phương trình mặt phẳng",
                     "Phương trình đường thẳng trong không gian"]},
        {"chapter": "Xác suất",
         "lessons": ["Biến ngẫu nhiên rời rạc", "Phân phối nhị thức", "Kỳ vọng và phương sai"]},
    ],
    12: [
        {"chapter": "Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số",
         "lessons": ["Tính đơn điệu của hàm số", "Cực trị của hàm số",
                     "Giá trị lớn nhất và nhỏ nhất của hàm số", "Đường tiệm cận",
                     "Khảo sát và vẽ đồ thị hàm số"]},
        {"chapter": "Hàm số lũy thừa, hàm số mũ và hàm số logarit",
         "lessons": ["Lũy thừa với số mũ thực", "Hàm số lũy thừa", "Hàm số mũ",
                     "Hàm số logarit", "Phương trình và bất phương trình mũ, logarit"]},
        {"chapter": "Nguyên hàm và tích phân",
         "lessons": ["Nguyên hàm", "Tích phân", "Ứng dụng tích phân"]},
        {"chapter": "Số phức",
         "lessons": ["Số phức", "Các phép tính về số phức", "Dạng lượng giác của số phức",
                     "Phương trình bậc hai với hệ số thực"]},
        {"chapter": "Thể tích khối đa diện",
         "lessons": ["Khái niệm về khối đa diện", "Khối lăng trụ và khối chóp",
                     "Thể tích khối đa diện"]},
        {"chapter": "Mặt nón, mặt trụ, mặt cầu",
         "lessons": ["Mặt tròn xoay", "Mặt cầu", "Diện tích và thể tích các khối tròn xoay"]},
        {"chapter": "Xác suất",
         "lessons": ["Biến ngẫu nhiên liên tục", "Phân phối chuẩn",
                     "Mẫu thống kê và ước lượng tham số"]},
    ],
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase + strip accents for dedup comparison."""
    text = re.sub(r"^(b[àa]i|ch[uưư][oơ]ng)\s+[\dIVXLCDMivxlcdm]+[a-z]?\.\s*", "", text.strip().lower())
    nfkd = unicodedata.normalize("NFKD", text.strip())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def should_skip(line: str) -> bool:
    return any(kw.lower() in line.lower() for kw in SKIP_KEYWORDS)


def is_junk(line: str) -> bool:
    lower = line.lower()
    return (
        any(lower.startswith(j.lower()) for j in JUNK_PREFIXES)
        or not line.strip()
        or lower.startswith("phần ")      # "Phần bốn DI TRUYỀN HỌC" — section header
        or lower.startswith("mục lục")
        or re.match(r"^bài\s+tập", lower) # standalone "Bài tập" header
    )


# Chapter: "Chương X." or "CHƯƠNG X." where X = Arabic digit or Roman numeral
# Also handles typo "Chương l" (lowercase L used as Roman I on some pages)
_CHAPTER_RE = re.compile(
    r"^ch[uưư][oơo]ng\s+([IVXLCDM]+|\d+)[a-z]?\b",
    re.IGNORECASE | re.UNICODE,
)


def is_chapter(line: str) -> bool:
    return bool(_CHAPTER_RE.match(line.strip()))


def extract_chapter_name(line: str) -> str:
    """Strip 'Chương X. ' prefix and trailing period."""
    name = _CHAPTER_RE.sub("", line.strip()).lstrip(". ").rstrip(". ")
    return name.strip()


def extract_lesson_name(line: str) -> str:
    """Strip 'Bài X. ' prefix and trailing period."""
    name = re.sub(r"^b[àa]i\s+[\dIVXLCDMivxlcdm]+[a-z]?\.\s*", "", line.strip(), flags=re.IGNORECASE)
    return name.rstrip(". ").strip()


def collect_lines(content) -> list[str]:
    """
    Walk .entry-content and extract all text lines separated by <br/> tags.
    Handles both plain-text paragraphs and <strong>-wrapped chapter lines.
    """
    all_lines = []
    for p in content.find_all("p"):
        current = ""
        for node in p.children:
            tag = getattr(node, "name", None)
            if tag == "br":
                line = current.strip()
                if line:
                    all_lines.append(line)
                current = ""
            elif tag:
                # Any nested tag (<strong>, <em>, <a>, etc.) — extract text
                current += node.get_text()
            else:
                current += str(node)
        # Flush last segment
        line = current.strip()
        if line:
            all_lines.append(line)
    return all_lines


def fetch_page(url: str) -> list[dict]:
    """
    Fetch one thi247 page and return a list of chapters with their lessons.
    Returns: [{"chapter": "...", "lessons": ["...", ...]}, ...]
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f"  Failed to fetch {url}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    content = soup.find("div", class_="entry-content")
    if not content:
        log.warning(f"  No .entry-content found at {url}")
        return []

    all_lines = collect_lines(content)

    chapters: list[dict] = []
    current_chapter: dict | None = None

    for raw_line in all_lines:
        line = raw_line.strip().rstrip(".")

        if not line or is_junk(line):
            continue

        if is_chapter(line):
            name = extract_chapter_name(line)
            current_chapter = {"chapter": name, "lessons": []}
            chapters.append(current_chapter)

        else:
            # Any non-junk, non-chapter line inside a chapter context = lesson
            if current_chapter is None:
                continue
            if should_skip(line):
                continue
            name = extract_lesson_name(line)
            if name:
                current_chapter["lessons"].append(name)

    return chapters


def merge_chapters(series_a: list[dict], series_b: list[dict]) -> list[dict]:
    """
    Merge two chapter lists (same subject+grade, different textbook series).
    Primary source = series_a; series_b supplements missing chapters/lessons.
    """
    merged = [{"chapter": c["chapter"], "lessons": list(c["lessons"])} for c in series_a]
    seen_chapters = {normalize(c["chapter"]): c for c in merged}

    for ch_b in series_b:
        key_b = normalize(ch_b["chapter"])
        match = seen_chapters.get(key_b)

        if match is None:
            new_ch = {"chapter": ch_b["chapter"], "lessons": list(ch_b["lessons"])}
            merged.append(new_ch)
            seen_chapters[key_b] = new_ch
        else:
            seen_lessons = {normalize(l) for l in match["lessons"]}
            for lesson in ch_b["lessons"]:
                if normalize(lesson) not in seen_lessons:
                    match["lessons"].append(lesson)
                    seen_lessons.add(normalize(lesson))

    return merged


def run():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Step 1: Fetch all pages
    raw: dict[tuple, list[dict]] = {}
    urls_to_fetch = [e for e in CATALOG if e["url"]]
    log.info(f"Fetching {len(urls_to_fetch)} pages (Toán uses manual fallback)...\n")

    for i, entry in enumerate(CATALOG):
        key = (entry["subject"], entry["grade"], entry["series"])
        if entry["url"] is None:
            log.info(f"[skip] {entry['subject']} lớp {entry['grade']} — {entry['series']} (no URL, using fallback)")
            raw[key] = []
            continue

        log.info(f"[{i+1}/{len(CATALOG)}] {entry['subject']} lớp {entry['grade']} — {entry['series']}")
        chapters = fetch_page(entry["url"])
        log.info(f"  → {len(chapters)} chương, {sum(len(c['lessons']) for c in chapters)} bài")
        raw[key] = chapters
        time.sleep(REQUEST_DELAY)

    # Step 2: Merge series per subject+grade
    result = {}
    subjects = ["Hóa học", "Vật lí", "Toán", "Sinh học"]
    grades = [10, 11, 12]

    log.info("\n── Merging & deduplicating ──────────────────────────────")
    for subject in subjects:
        result[subject] = {}
        for grade in grades:
            key_kn = (subject, grade, "Kết nối tri thức")
            key_ct = (subject, grade, "Chân trời sáng tạo")
            chapters_kn = raw.get(key_kn, [])
            chapters_ct = raw.get(key_ct, [])

            # Toán: use manual fallback if crawl returned nothing
            if subject == "Toán" and not chapters_kn and not chapters_ct:
                merged = TOAN_FALLBACK.get(grade, [])
                log.info(f"  ✓ {subject} lớp {grade}: {len(merged)} chương, "
                         f"{sum(len(c['lessons']) for c in merged)} bài (fallback)")
            elif chapters_kn and chapters_ct:
                merged = merge_chapters(chapters_kn, chapters_ct)
                log.info(f"  ✓ {subject} lớp {grade}: {len(merged)} chương, "
                         f"{sum(len(c['lessons']) for c in merged)} bài (merged)")
            elif chapters_kn:
                merged = [{"chapter": c["chapter"], "lessons": list(c["lessons"])} for c in chapters_kn]
                log.info(f"  ✓ {subject} lớp {grade}: {len(merged)} chương, "
                         f"{sum(len(c['lessons']) for c in merged)} bài (KN only)")
            elif chapters_ct:
                merged = [{"chapter": c["chapter"], "lessons": list(c["lessons"])} for c in chapters_ct]
                log.info(f"  ✓ {subject} lớp {grade}: {len(merged)} chương, "
                         f"{sum(len(c['lessons']) for c in merged)} bài (CT only)")
            else:
                merged = []
                log.warning(f"  ⚠ {subject} lớp {grade}: no data!")

            result[subject][str(grade)] = merged

    # Step 3: Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total_chapters = sum(len(result[s][g]) for s in result for g in result[s])
    total_lessons = sum(
        len(ch["lessons"])
        for s in result for g in result[s]
        for ch in result[s][g]
    )
    log.info(f"\n✅ Done! Written to {OUTPUT_FILE}")
    log.info(f"   {total_chapters} chương — {total_lessons} bài")


if __name__ == "__main__":
    run()
