"""
SM-2 Spaced Repetition Service — Routex
=========================================
Thuật toán SM-2 gốc (SuperMemo 2) để lên lịch ôn tập thông minh.

Logic:
- Mỗi topic có: interval (ngày), easiness (EF), repetitions, next_review_date
- Sau mỗi lần ôn, tính lại interval dựa trên chất lượng trả lời (q = 0..5)
- next_review_date = hôm nay + interval
- Nếu q < 3 (trả lời kém): reset về interval=1, repetitions=0
- Nếu q >= 3: tăng interval theo EF

Mapping score (0–10) → SM-2 quality (0–5):
  >= 9.0 → 5 (Perfect)
  >= 8.0 → 4 (Correct with hesitation)
  >= 7.0 → 3 (Correct but required effort)
  >= 6.0 → 2 (Incorrect but easy to recall)
  >= 5.0 → 1 (Incorrect but remembered)
  <  5.0 → 0 (Complete blackout)
"""

from datetime import datetime, date, timedelta, timezone
from app.models.progress import UserMastery


# ─── SM-2 Core ───────────────────────────────────────────────────────────────

def score_to_quality(score: float) -> int:
    """Chuyển điểm test (0–10) sang SM-2 quality (0–5)."""
    if score >= 9.0:
        return 5
    elif score >= 8.0:
        return 4
    elif score >= 7.0:
        return 3
    elif score >= 6.0:
        return 2
    elif score >= 5.0:
        return 1
    else:
        return 0


def compute_sm2(
    repetitions: int,
    easiness: float,
    interval: int,
    quality: int,
) -> tuple[int, float, int, date]:
    """
    Tính SM-2 cho một lần ôn.

    Args:
        repetitions: Số lần ôn thành công liên tiếp (q >= 3)
        easiness: Hệ số dễ (EF), bắt đầu từ 2.5, min 1.3
        interval: Khoảng cách hiện tại (ngày)
        quality: Chất lượng trả lời (0–5)

    Returns:
        (new_repetitions, new_easiness, new_interval, next_review_date)
    """
    # Cập nhật EF
    new_ef = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)

    if quality < 3:
        # Trả lời kém → reset về đầu
        new_repetitions = 0
        new_interval = 1
    else:
        new_repetitions = repetitions + 1
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            new_interval = round(interval * new_ef)

    today = datetime.now(timezone.utc).date()
    next_review = today + timedelta(days=new_interval)

    return new_repetitions, new_ef, new_interval, next_review


def update_mastery_sm2(mastery: UserMastery, score: float) -> None:
    """
    Cập nhật SM-2 fields trên một UserMastery record sau khi ôn.

    Args:
        mastery: SQLAlchemy UserMastery instance (sẽ mutate trực tiếp)
        score: Điểm test 0–10
    """
    quality = score_to_quality(score)

    reps = mastery.sm2_repetitions or 0
    ef = mastery.sm2_easiness or 2.5
    interval = mastery.sm2_interval or 1

    new_reps, new_ef, new_interval, next_review = compute_sm2(
        repetitions=reps,
        easiness=ef,
        interval=interval,
        quality=quality,
    )

    mastery.sm2_repetitions = new_reps
    mastery.sm2_easiness = round(new_ef, 4)
    mastery.sm2_interval = new_interval
    mastery.next_review_date = datetime.combine(next_review, datetime.min.time()).replace(tzinfo=timezone.utc)


def get_due_topics(masteries: list, subject: str | None = None) -> list[dict]:
    """
    Lọc ra các topic cần ôn hôm nay (next_review_date <= today).

    Args:
        masteries: List of (UserMastery, Topic) tuples từ DB query
        subject: Filter theo môn học (optional)

    Returns:
        List of dicts với topic info + SM-2 metadata
    """
    today = datetime.now(timezone.utc).date()
    due = []

    for m, t in masteries:
        if subject and t.subject != subject:
            continue

        # Topic chưa từng được SM-2 schedule → chưa cần ôn
        if m.next_review_date is None:
            continue

        review_date = m.next_review_date
        if hasattr(review_date, 'date'):
            review_date = review_date.date()

        if review_date <= today:
            days_overdue = (today - review_date).days
            due.append({
                "topic": t.name,
                "subject": t.subject,
                "grade": t.grade,
                "mastery": round((m.mastery or 0.0) * 100),
                "next_review_date": m.next_review_date.isoformat() if hasattr(m.next_review_date, 'isoformat') else str(m.next_review_date),
                "sm2_interval": m.sm2_interval or 1,
                "sm2_repetitions": m.sm2_repetitions or 0,
                "days_overdue": days_overdue,
            })

    # Ưu tiên: overdue nhiều nhất → mastery thấp nhất
    due.sort(key=lambda x: (-x["days_overdue"], x["mastery"]))
    return due
