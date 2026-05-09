from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.progress import UserMastery, WeeklyProgress, LearningPath
from app.models.curriculum import Topic
from app.models.config import LearningConfig
from app.models.assessment import Question, Test, UserAnswer
from datetime import datetime, timedelta, timezone
from app.services.mastery_engine import apply_decay
from app.services.sm2_service import get_due_topics

router = APIRouter()


def _topic_overlap(topic_name: str, weak_names: list[str]) -> list[str]:
    name = (topic_name or "").strip().lower()
    if not name:
        return []
    hits = []
    for weak in weak_names:
        w = (weak or "").strip().lower()
        if not w:
            continue
        if w in name or name in w:
            hits.append(weak)
    return hits


def _compute_streak(test_dates: list[datetime]) -> dict:
    # Use UTC day boundaries for now (frontend can message locally).
    today = datetime.now(timezone.utc).date()
    days = sorted({d.astimezone(timezone.utc).date() for d in test_dates if isinstance(d, datetime)})
    dayset = set(days)

    studied_today = today in dayset

    # Current streak counts backward from today if studied today, otherwise from yesterday.
    start_day = today if studied_today else (today - timedelta(days=1))
    current = 0
    cur = start_day
    while cur in dayset:
        current += 1
        cur = cur - timedelta(days=1)

    # Longest streak in history.
    longest = 0
    run = 0
    prev = None
    for d in days:
        if prev is None:
            run = 1
        else:
            run = run + 1 if (d - prev).days == 1 else 1
        prev = d
        if run > longest:
            longest = run

    milestones = [3, 7, 14, 30, 60, 100]
    earned = [m for m in milestones if current >= m]
    next_milestone = next((m for m in milestones if m > current), None)
    last_study_date = days[-1].isoformat() if days else None

    return {
        "current": current,
        "longest": longest,
        "studied_today": studied_today,
        "last_study_date": last_study_date,
        "earned_milestones": earned,
        "next_milestone": next_milestone,
    }

@router.get("/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user!")

    cfg = db.query(LearningConfig).filter(LearningConfig.user_id == user_id).first()

    masteries = db.query(UserMastery, Topic).join(Topic).filter(
        UserMastery.user_id == user_id
    ).all()

    mastery_list = [
        {
            "topic": t.name,
            "subject": t.subject,
            "grade": t.grade,
            # Áp dụng time decay: mastery giảm dần nếu user không ôn topic này
            "mastery": round(apply_decay(m.mastery, m.last_reviewed) * 100),
            "last_reviewed": m.last_reviewed.isoformat() if m.last_reviewed else None,
        }
        for m, t in masteries
    ]

    weak_topics = [x for x in mastery_list if x["mastery"] < 50]
    strong_topics = [x for x in mastery_list if x["mastery"] >= 70]

    avg_mastery = round(sum(x["mastery"] for x in mastery_list) / len(mastery_list)) if mastery_list else 0
    weak_ratio = round(len(weak_topics) / len(mastery_list) * 100) if mastery_list else 0

    weekly = db.query(WeeklyProgress).filter(WeeklyProgress.user_id == user_id).order_by(
        WeeklyProgress.week
    ).all()
    weekly_data = [{"week": w.week, "score": w.score, "study_time": w.study_time} for w in weekly]

    path = db.query(LearningPath, Topic).join(Topic).filter(
        LearningPath.user_id == user_id
    ).order_by(LearningPath.week, LearningPath.path_id).all()
    path_data = [{"topic": t.name, "week": lp.week, "status": lp.status} for lp, t in path]

    weak_names = [w["topic"] for w in weak_topics]
    current_path = next((x for x in path_data if x.get("status") == "in_progress"), None)
    current_related_weak = _topic_overlap(current_path.get("topic"), weak_names) if current_path else []

    # Chronic weak topics from wrong answers across the last 3 mini-test weeks.
    latest_test_week = db.query(func.max(Test.week)).filter(Test.user_id == user_id).scalar() or 0
    chronic_rows = []
    if latest_test_week:
        chronic_rows = (
            db.query(Topic.name, Test.week)
            .join(Question, Question.topic_id == Topic.id)
            .join(UserAnswer, UserAnswer.question_id == Question.id)
            .join(Test, Test.id == UserAnswer.test_id)
            .filter(
                UserAnswer.user_id == user_id,
                UserAnswer.is_correct.is_(False),
                Test.week >= max(1, latest_test_week - 2),
                Test.week <= latest_test_week,
            )
            .all()
        )
    chronic_map: dict[str, set[int]] = {}
    for topic_name, week_num in chronic_rows:
        if not topic_name or week_num is None:
            continue
        chronic_map.setdefault(topic_name, set()).add(int(week_num))
    chronic_weak_topics = sorted([name for name, weeks in chronic_map.items() if len(weeks) >= 2])

    # Study streak based on submitted tests (entrance + mini tests).
    test_dates = db.query(Test.created_at).filter(Test.user_id == user_id).all()
    streak = _compute_streak([row[0] for row in test_dates if row and row[0]])

    # SM-2: topics cần ôn hôm nay
    due_reviews = get_due_topics(masteries, subject=cfg.subject if cfg else None)

    return {
        "user": {"id": user.id, "username": user.username, "grade": user.grade},
        "config": {
            "subject": cfg.subject if cfg else None,
            "grade": cfg.grade if cfg else None,
            "mode": cfg.mode if cfg else None,
            "target_score": cfg.target_score if cfg else None
        } if cfg else None,
        "overview": {
            "avg_mastery": avg_mastery,
            "weak_ratio": weak_ratio,
            "total_topics": len(mastery_list),
            "weak_count": len(weak_topics),
            "strong_count": len(strong_topics)
        },
        "mastery_topics": mastery_list,
        "weak_topics": weak_topics[:10],
        "chronic_weak_topics": chronic_weak_topics[:10],
        "current_topic_warning": {
            "topic": current_path.get("topic") if current_path else None,
            "related_weak_topics": current_related_weak,
            "message": (
                f"Chủ đề này liên quan đến {', '.join(current_related_weak)} mà bạn đang yếu, nên ôn lại trước."
                if current_related_weak else None
            ),
        },
        "weekly_progress": weekly_data,
        "learning_path": path_data,
        "study_streak": streak,
        "due_reviews": due_reviews[:5],
        "due_reviews_count": len(due_reviews),
    }
