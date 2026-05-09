"""
Mastery Engine — Routex
========================
Tính toán mastery theo 2 cơ chế:

1. Weighted by difficulty
   - Câu khó (difficulty >= 0.7): đúng +0.15, sai -0.08
   - Câu trung bình (0.4 <= difficulty < 0.7): đúng +0.10, sai -0.05
   - Câu dễ (difficulty < 0.4): đúng +0.05, sai -0.03
   Lý do: Làm đúng câu khó chứng tỏ hiểu sâu hơn câu dễ.
   Làm sai câu dễ cũng đáng bị trừ nhiều hơn.

2. Time decay
   Mastery giảm dần theo thời gian nếu không ôn lại.
   Dùng exponential decay: mastery_decayed = mastery * e^(-lambda * days)
   Lambda = 0.02 → sau 35 ngày không ôn, mastery giảm ~50%.
   Decay chỉ áp dụng khi đọc (dashboard), không ghi vào DB mỗi giây.
"""

import math
from datetime import datetime, timezone


# ─── Constants ───────────────────────────────────────────────────────────────

# Decay rate: 0.02 → half-life ~35 ngày
_DECAY_LAMBDA = 0.02

# Difficulty thresholds
_HARD_THRESHOLD   = 0.70
_MEDIUM_THRESHOLD = 0.40

# Delta khi đúng (gain) theo độ khó
_GAIN_HARD   = 0.15
_GAIN_MEDIUM = 0.10
_GAIN_EASY   = 0.05

# Delta khi sai (penalty) theo độ khó
_PENALTY_HARD   = 0.08
_PENALTY_MEDIUM = 0.05
_PENALTY_EASY   = 0.03


# ─── Core functions ──────────────────────────────────────────────────────────

def compute_delta(is_correct: bool, difficulty: float) -> float:
    """
    Trả về lượng thay đổi mastery cho 1 câu trả lời.
    Giá trị dương = tăng mastery, âm = giảm.

    Args:
        is_correct: True nếu trả lời đúng
        difficulty: float 0.0–1.0 (lấy từ Question.difficulty)

    Returns:
        float: delta mastery, chưa clamp vào [0, 1]
    """
    diff = float(difficulty or 0.5)

    if diff >= _HARD_THRESHOLD:
        return _GAIN_HARD if is_correct else -_PENALTY_HARD
    elif diff >= _MEDIUM_THRESHOLD:
        return _GAIN_MEDIUM if is_correct else -_PENALTY_MEDIUM
    else:
        return _GAIN_EASY if is_correct else -_PENALTY_EASY


def apply_decay(mastery: float, last_reviewed: datetime | None) -> float:
    """
    Áp dụng time decay lên mastery dựa trên ngày ôn cuối cùng.
    Chỉ dùng khi ĐỌC (hiển thị dashboard), không ghi vào DB.

    Công thức: mastery_now = mastery * e^(-lambda * days_since_review)

    Args:
        mastery: giá trị mastery lưu trong DB (0.0–1.0)
        last_reviewed: datetime lần cuối user làm câu hỏi thuộc topic này

    Returns:
        float: mastery sau decay, clamped [0.0, 1.0]
    """
    if last_reviewed is None or mastery <= 0:
        return mastery

    now = datetime.now(timezone.utc)

    # Đảm bảo last_reviewed có timezone
    if last_reviewed.tzinfo is None:
        last_reviewed = last_reviewed.replace(tzinfo=timezone.utc)

    days_elapsed = (now - last_reviewed).total_seconds() / 86400.0

    # Không decay nếu mới ôn trong 24h
    if days_elapsed < 1.0:
        return mastery

    decayed = mastery * math.exp(-_DECAY_LAMBDA * days_elapsed)
    return max(0.0, min(1.0, decayed))


def update_mastery(current_mastery: float, is_correct: bool, difficulty: float) -> float:
    """
    Tính giá trị mastery mới sau 1 câu trả lời.
    Dùng trong submit_test để GHI vào DB.

    Args:
        current_mastery: mastery hiện tại trong DB (0.0–1.0)
        is_correct: kết quả trả lời
        difficulty: độ khó câu hỏi (0.0–1.0)

    Returns:
        float: mastery mới, clamped [0.0, 1.0]
    """
    delta = compute_delta(is_correct, difficulty)
    new_mastery = current_mastery + delta
    return max(0.0, min(1.0, new_mastery))


def mastery_with_decay_percent(mastery: float, last_reviewed: datetime | None) -> int:
    """
    Tiện ích: trả về mastery sau decay dưới dạng phần trăm (0–100).
    Dùng khi build response cho dashboard/API.
    """
    decayed = apply_decay(mastery, last_reviewed)
    return round(decayed * 100)


# ─── Difficulty label (helper cho frontend) ──────────────────────────────────

def difficulty_label(difficulty: float) -> str:
    """Trả về label tiếng Việt cho độ khó."""
    d = float(difficulty or 0.5)
    if d >= _HARD_THRESHOLD:
        return "khó"
    elif d >= _MEDIUM_THRESHOLD:
        return "trung bình"
    return "dễ"
