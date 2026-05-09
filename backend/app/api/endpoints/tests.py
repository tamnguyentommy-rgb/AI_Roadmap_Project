import json
import asyncio
import unicodedata
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from app.db.session import get_db
from app.models.assessment import Question, Test, UserAnswer, test_questions
from app.models.curriculum import Topic
from app.models.progress import UserMastery, WeeklyProgress, LearningPath
from app.models.user import User
from app.schemas.assessment import TestOut, QuestionOut, TestSubmit, TestResult, AnswerResult
from app.services.llm_service import llm_service
from app.services.mastery_engine import update_mastery
from app.services.sm2_service import update_mastery_sm2

def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s) if s else s

router = APIRouter()


def _get_week_wrong_topics(db: Session, user_id: int, week: Optional[int]) -> list[str]:
    if week is None:
        return []
    rows = (
        db.query(Topic.name)
        .join(Question, Question.topic_id == Topic.id)
        .join(UserAnswer, UserAnswer.question_id == Question.id)
        .join(Test, Test.id == UserAnswer.test_id)
        .filter(
            UserAnswer.user_id == user_id,
            UserAnswer.is_correct.is_(False),
            Test.week == week,
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows if r and r[0]]



async def _ensure_mcq(question: Question, db: Session) -> Question:
    """If question has no options, call LLM to generate them."""
    if question.option_a:
        return question
    try:
        prompt = f"""Bạn là giáo viên THPT Việt Nam chuyên soạn đề trắc nghiệm. Hãy chuyển câu hỏi tự luận sau thành câu trắc nghiệm 4 lựa chọn A, B, C, D rõ ràng, chuẩn xác cho học sinh lớp 10-12.

Câu hỏi gốc: "{question.content}"

Yêu cầu:
1. Đáp án đúng phải chính xác về mặt khoa học.
2. Ba đáp án sai phải hợp lý, có vẻ đúng (không quá dễ nhận ra), để thực sự kiểm tra hiểu biết.
3. Mỗi đáp án phải đủ ý, rõ nghĩa (1-2 câu nếu cần), không quá 40 từ.
4. Giải thích tại sao đáp án đúng là đúng, và tại sao các đáp án sai lại không đúng (2-3 câu ngắn gọn).

Trả về JSON theo đúng định dạng sau (không thêm bất kỳ text nào khác):
{{
  "A": "Nội dung lựa chọn A",
  "B": "Nội dung lựa chọn B",
  "C": "Nội dung lựa chọn C",
  "D": "Nội dung lựa chọn D",
  "correct": "A",
  "explanation": "Đáp án [X] đúng vì... Các đáp án còn lại sai vì..."
}}"""

        raw = await llm_service._call_json(prompt)
        if not raw:
            raise Exception("LLM không trả về kết quả")

        data = json.loads(raw.strip())

        question.option_a = data.get("A", "")
        question.option_b = data.get("B", "")
        question.option_c = data.get("C", "")
        question.option_d = data.get("D", "")
        question.correct_answer = data.get("correct", "A")
        question.explanation = data.get("explanation", "")
        db.commit()
    except Exception as e:
        question.option_a = "Câu hỏi này chưa có đáp án – vui lòng thử lại"
        question.option_b = "Kiểm tra kết nối API"
        question.option_c = "Lỗi tạo đáp án tự động"
        question.option_d = "Hãy liên hệ quản trị viên"
        question.correct_answer = "A"
        question.explanation = f"Lỗi hệ thống khi tạo đáp án: {str(e)}"
        db.commit()
    return question


@router.get("/generate", response_model=TestOut)
async def generate_test(
    subject: str,
    grade: int,
    limit: int = 10,
    topic: Optional[str] = None,
    topics: Optional[list[str]] = Query(default=None),
    db: Session = Depends(get_db)
):
    subject = nfc(subject)

    base = db.query(Question).join(Topic).filter(
        Topic.subject == subject,
        Topic.grade == grade
    )

    if topic:
        topic_nfc = nfc(topic)
        questions = base.filter(Topic.name == topic_nfc).order_by(func.random()).limit(limit).all()
        if not questions:
            like = f"%{topic_nfc}%"
            questions = base.filter(Topic.name.ilike(like)).order_by(func.random()).limit(limit).all()
        if not questions:
            raise HTTPException(
                status_code=404,
                detail=f"Chưa có câu hỏi cho chủ đề \"{topic_nfc}\" ({subject} lớp {grade}). Hãy thử lại sau hoặc chọn chủ đề khác."
            )
    elif topics:
        topics_nfc = [nfc(t) for t in topics]
        questions = base.filter(Topic.name.in_(topics_nfc)).order_by(func.random()).limit(limit).all()
        if not questions:
            questions = base.order_by(func.random()).limit(limit).all()
        if not questions:
            raise HTTPException(status_code=404, detail=f"Không có câu hỏi nào cho {subject} lớp {grade}. Hãy chạy seed trước!")
    else:
        questions = base.order_by(func.random()).limit(limit).all()
        if not questions:
            raise HTTPException(status_code=404, detail=f"Không có câu hỏi nào cho {subject} lớp {grade}. Hãy chạy seed trước!")

    enriched = await asyncio.gather(*[_ensure_mcq(q, db) for q in questions])

    new_test = Test(user_id=1, week=-1)
    db.add(new_test)
    db.flush()
    for q in enriched:
        db.execute(test_questions.insert().values(test_id=new_test.id, question_id=q.id))
    db.commit()
    db.refresh(new_test)

    return TestOut(
        test_id=new_test.id,
        questions=[QuestionOut(
            id=q.id,
            content=q.content,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            topic_id=q.topic_id
        ) for q in enriched]
    )


def _already_answered_ids(db: Session, user_id: int, limit: int = 200) -> set[int]:
    """Return set of question IDs the user answered recently (last ~200 answers)."""
    rows = (
        db.query(UserAnswer.question_id)
        .filter(UserAnswer.user_id == user_id)
        .order_by(UserAnswer.id.desc())
        .limit(limit)
        .all()
    )
    return {r[0] for r in rows}


def _pick_db_questions(
    db: Session,
    subject: str,
    grade: int,
    topic_nfc: str,
    exclude_ids: set[int],
    limit: int,
) -> tuple[list[Question], Optional[Topic]]:
    """
    Try to pull `limit` questions from the DB for the given subject/grade/topic.
    Matches: exact topic name → fuzzy prefix/suffix → subject+grade pool.
    Returns (questions, matched_topic_or_None).
    """
    base = (
        db.query(Question)
        .join(Topic)
        .filter(
            Topic.subject == subject,
            Topic.grade == grade,
            Question.option_a.isnot(None),
            Question.option_a != "",
        )
    )

    # 1. Exact topic match
    qs = (
        base.filter(Topic.name == topic_nfc)
        .order_by(func.random())
        .all()
    )
    matched_topic: Optional[Topic] = None
    if qs:
        matched_topic = db.query(Topic).filter(Topic.name == topic_nfc, Topic.subject == subject, Topic.grade == grade).first()

    # 2. Partial fuzzy match — split topic into keywords and OR-match
    if not qs:
        keywords = [kw for kw in topic_nfc.replace(",", " ").split() if len(kw) > 2]
        for kw in keywords[:3]:
            qs = base.filter(Topic.name.ilike(f"%{kw}%")).order_by(func.random()).all()
            if qs:
                matched_topic = db.query(Topic).filter(Topic.name.ilike(f"%{kw}%"), Topic.subject == subject, Topic.grade == grade).first()
                break

    # 3. Broad subject/grade pool (any topic)
    if not qs:
        qs = base.order_by(func.random()).limit(limit * 3).all()

    # Exclude already-answered, then take limit
    filtered = [q for q in qs if q.id not in exclude_ids]
    # If filtering left too few, relax exclusion
    if len(filtered) < limit and len(qs) >= limit:
        filtered = qs[:limit]

    return filtered[:limit], matched_topic


@router.get("/generate_mini", response_model=TestOut)
async def generate_mini_test(
    subject: str,
    grade: int,
    topic: str,
    user_id: int,
    week: Optional[int] = None,
    weak_topics: Optional[list[str]] = Query(default=None),
    limit: int = 5,
    db: Session = Depends(get_db),
):
    """Generate a mini test for a roadmap week.

    Strategy:
    1. Pull questions from DB first (faster, no API cost, dedup by recent history).
    2. If DB yields enough questions → use them directly.
    3. If DB yields < limit → supplement remaining slots with LLM generation.
    4. If DB yields 0 → full LLM generation.
    """
    subject = nfc(subject)
    topic_nfc = nfc(topic)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại!")
    current_score = float(user.current_score or 5.0)
    prev_overlap_topics = _get_week_wrong_topics(db, user_id, (week - 1) if week is not None else None)
    if weak_topics:
        current_score = max(3.5, current_score - min(1.0, 0.2 * len(weak_topics)))
    eff_grade = int(grade or user.grade or 12)

    # ── Step 1: pull from DB ──────────────────────────────────────────────────
    exclude_ids = _already_answered_ids(db, user_id)
    db_questions, matched_topic = _pick_db_questions(
        db, subject, eff_grade, topic_nfc, exclude_ids, limit
    )

    # ── Step 2: resolve / create topic record ─────────────────────────────────
    target_topic: Optional[Topic] = matched_topic
    if not target_topic:
        target_topic = (
            db.query(Topic)
            .filter(Topic.subject == subject, Topic.grade == eff_grade, Topic.name == topic_nfc)
            .first()
        )
    if not target_topic:
        target_topic = Topic(
            subject=subject,
            grade=eff_grade,
            name=topic_nfc,
            description=f"Chủ đề mini test: {topic_nfc}",
        )
        db.add(target_topic)
        db.flush()

    # ── Step 3: determine how many LLM questions we still need ────────────────
    llm_needed = max(0, limit - len(db_questions))
    llm_questions_data: list[dict] = []

    if llm_needed > 0:
        llm_questions_data = await llm_service.generate_mcq_batch(
            subject=subject,
            grade=eff_grade,
            topic=topic_nfc,
            current_score=current_score,
            count=llm_needed,
            weak_topics=weak_topics or [],
            overlap_topics=prev_overlap_topics,
        ) or []

    # ── Step 4: build the test ────────────────────────────────────────────────
    new_test = Test(user_id=user_id, week=week or 0)
    db.add(new_test)
    db.flush()

    out_questions: list[Question] = []

    # Add DB questions
    for q in db_questions:
        db.execute(test_questions.insert().values(test_id=new_test.id, question_id=q.id))
        out_questions.append(q)

    # Add LLM-generated questions
    for qd in llm_questions_data[:llm_needed]:
        content = qd.get("content", "").strip()
        if not content:
            continue
        correct = (qd.get("correct") or "A").strip().upper()
        if correct not in ("A", "B", "C", "D"):
            correct = "A"
        try:
            diff = float(qd.get("difficulty", 0.5))
        except Exception:
            diff = 0.5

        q = Question(
            topic_id=target_topic.id,
            content=content,
            option_a=qd.get("A", "").strip(),
            option_b=qd.get("B", "").strip(),
            option_c=qd.get("C", "").strip(),
            option_d=qd.get("D", "").strip(),
            correct_answer=correct,
            explanation=(qd.get("explanation") or "").strip(),
            difficulty=diff,
        )
        db.add(q)
        db.flush()
        db.execute(test_questions.insert().values(test_id=new_test.id, question_id=q.id))
        out_questions.append(q)

    if not out_questions:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Không đủ câu hỏi — AI đang bận hoặc chủ đề chưa có trong ngân hàng. Thử lại nhé!",
        )

    db.commit()
    db.refresh(new_test)

    return TestOut(
        test_id=new_test.id,
        questions=[
            QuestionOut(
                id=q.id,
                content=q.content,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                topic_id=q.topic_id,
            )
            for q in out_questions
        ],
    )


@router.post("/submit", response_model=TestResult)
def submit_test(user_id: int, payload: TestSubmit, db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == payload.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test không tồn tại!")

    # Always attribute the test to the submitting user so we can track streaks
    # and history consistently (entrance exam included).
    test.user_id = user_id

    if payload.week is not None:
        test.week = payload.week

    correct_count = 0
    results = []
    weak_topic_ids = set()

    for ans in payload.answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue

        is_correct = (ans.selected_answer == q.correct_answer)
        if is_correct:
            correct_count += 1
        else:
            weak_topic_ids.add(q.topic_id)

        db.add(UserAnswer(
            test_id=payload.test_id,
            question_id=ans.question_id,
            user_id=user_id,
            selected_option=ans.selected_answer,
            is_correct=is_correct
        ))

        mastery = db.query(UserMastery).filter(
            UserMastery.user_id == user_id,
            UserMastery.topic_id == q.topic_id
        ).first()
        if not mastery:
            mastery = UserMastery(user_id=user_id, topic_id=q.topic_id, mastery=0.0)
            db.add(mastery)
            db.flush()

        # Weighted by difficulty + cập nhật last_reviewed
        mastery.mastery = update_mastery(
            current_mastery=mastery.mastery,
            is_correct=is_correct,
            difficulty=q.difficulty or 0.5,
        )
        mastery.last_updated = datetime.utcnow()
        mastery.last_reviewed = datetime.utcnow()

        results.append(AnswerResult(
            question_id=ans.question_id,
            selected_answer=ans.selected_answer,
            is_correct=is_correct,
            correct_answer=q.correct_answer or "A",
            explanation=q.explanation or ""
        ))

    total = len(payload.answers)
    score = round((correct_count / total) * 10, 2) if total > 0 else 0.0
    test.score = score

    # Adaptive difficulty: update user's current_score as weighted rolling average
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        old = float(user.current_score or 5.0)
        user.current_score = round(old * 0.65 + score * 0.35, 2)
        db.add(user)

    # For mini tests tied to a roadmap week, log progress and (if passed)
    # mark the week's topic as completed so the dashboard advances. We never
    # generate a new roadmap here — the user keeps the roadmap chosen at signup.
    if payload.is_mini_test and payload.week is not None:
        wp = db.query(WeeklyProgress).filter(
            WeeklyProgress.user_id == user_id,
            WeeklyProgress.week == payload.week,
        ).first()
        if not wp:
            wp = WeeklyProgress(user_id=user_id, week=payload.week, score=score, study_time=0.0)
            db.add(wp)
        else:
            wp.score = max(wp.score or 0.0, score)

        if payload.topic_name:
            topic_nfc = nfc(payload.topic_name)
            target_topic = db.query(Topic).filter(Topic.name == topic_nfc).first()
            if not target_topic:
                target_topic = db.query(Topic).filter(Topic.name.ilike(f"%{topic_nfc}%")).first()

            if target_topic:
                lp = db.query(LearningPath).filter(
                    LearningPath.user_id == user_id,
                    LearningPath.week == payload.week,
                    LearningPath.topic_id == target_topic.id,
                ).first()
                # Pass threshold: 7/10 marks the week's topic as completed.
                new_status = "completed" if score >= 7.0 else "in_progress"
                if not lp:
                    lp = LearningPath(
                        user_id=user_id,
                        week=payload.week,
                        topic_id=target_topic.id,
                        status=new_status,
                    )
                    db.add(lp)
                else:
                    # Don't downgrade an already-completed topic.
                    if lp.status != "completed":
                        lp.status = new_status

    # SM-2: cập nhật schedule ôn tập theo điểm test
    # Tính điểm per-topic dựa trên số câu đúng/sai của từng topic
    topic_stats: dict[int, list[bool]] = {}
    for ans in payload.answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue
        is_correct = (ans.selected_answer == q.correct_answer)
        topic_stats.setdefault(q.topic_id, []).append(is_correct)

    for topic_id, topic_results in topic_stats.items():
        topic_score = (sum(topic_results) / len(topic_results)) * 10 if topic_results else 0
        m = db.query(UserMastery).filter(
            UserMastery.user_id == user_id,
            UserMastery.topic_id == topic_id,
        ).first()
        if m:
            update_mastery_sm2(m, topic_score)

    db.commit()

    weak_topics = []
    for tid in weak_topic_ids:
        t = db.query(Topic).filter(Topic.id == tid).first()
        if t:
            weak_topics.append(t.name)

    overlap_with_prev_week: list[str] = []
    chronic_weak_topics: list[str] = []
    if payload.is_mini_test and payload.week is not None:
        prev_weak = set(_get_week_wrong_topics(db, user_id, payload.week - 1))
        overlap_with_prev_week = sorted([t for t in weak_topics if t in prev_weak])

        # Chronic weak: appears in wrong answers across >=2 of last 3 mini-test weeks.
        streak_rows = (
            db.query(Topic.name, Test.week)
            .join(Question, Question.topic_id == Topic.id)
            .join(UserAnswer, UserAnswer.question_id == Question.id)
            .join(Test, Test.id == UserAnswer.test_id)
            .filter(
                UserAnswer.user_id == user_id,
                UserAnswer.is_correct.is_(False),
                Test.week.isnot(None),
                Test.week >= max(1, payload.week - 2),
                Test.week <= payload.week,
            )
            .all()
        )
        week_hits: dict[str, set[int]] = {}
        for topic_name, week_num in streak_rows:
            if not topic_name or week_num is None:
                continue
            week_hits.setdefault(topic_name, set()).add(int(week_num))
        chronic_weak_topics = sorted([name for name, weeks in week_hits.items() if len(weeks) >= 2])

    return TestResult(
        test_id=payload.test_id,
        total_questions=total,
        correct_count=correct_count,
        score=score,
        results=results,
        weak_topics=weak_topics,
        overlap_with_prev_week=overlap_with_prev_week,
        chronic_weak_topics=chronic_weak_topics,
    )


# ──────────────────────────────────────────────
# Mock Exam: 50-question THPT-format thi thử
# ──────────────────────────────────────────────

@router.post("/mock-exam", response_model=TestOut)
async def generate_mock_exam(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Generate a 50-question THPT-format mock exam.
    Uses existing DB questions first; AI fills the gap across roadmap topics."""
    from app.models.config import LearningConfig

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại!")

    cfg = db.query(LearningConfig).filter(LearningConfig.user_id == user_id).first()
    if not cfg:
        raise HTTPException(status_code=400, detail="Chưa cấu hình môn học!")

    subject = nfc(cfg.subject)
    grade = int(cfg.grade)
    target = 50

    # Step 1: Pull existing MCQ questions from DB
    db_questions = (
        db.query(Question)
        .join(Topic)
        .filter(
            Topic.subject == subject,
            Topic.grade == grade,
            Question.option_a.isnot(None),
            Question.option_a != "",
        )
        .order_by(func.random())
        .limit(target)
        .all()
    )
    questions: list[Question] = list(db_questions)
    need = target - len(questions)

    # Step 2: AI fills the gap across user's roadmap topics
    if need > 0:
        topic_rows = (
            db.query(Topic.name)
            .join(LearningPath, LearningPath.topic_id == Topic.id)
            .filter(LearningPath.user_id == user_id)
            .distinct()
            .all()
        )
        topic_names = [r[0] for r in topic_rows if r[0]]

        if not topic_names:
            all_topics = (
                db.query(Topic)
                .filter(Topic.subject == subject, Topic.grade == grade)
                .limit(15)
                .all()
            )
            topic_names = [t.name for t in all_topics]

        if not topic_names:
            topic_names = [f"Tổng hợp {subject} lớp {grade}"]

        current_score = float(user.current_score or 5.0)
        n = len(topic_names)
        per_topic = max(1, need // n)
        counts: list[int] = []
        remaining = need
        for i in range(n):
            c = min(per_topic, remaining) if i < n - 1 else remaining
            counts.append(c)
            remaining -= c
            if remaining <= 0:
                break

        ai_tasks = [
            llm_service.generate_mcq_batch(
                subject=subject,
                grade=grade,
                topic=tn,
                current_score=current_score,
                count=cnt,
                weak_topics=[],
                overlap_topics=[],
            )
            for tn, cnt in zip(topic_names, counts) if cnt > 0
        ]
        ai_results = await asyncio.gather(*ai_tasks, return_exceptions=True)

        for tn, result in zip(topic_names, ai_results):
            if isinstance(result, Exception) or not result:
                continue
            t = (
                db.query(Topic)
                .filter(Topic.subject == subject, Topic.grade == grade, Topic.name == tn)
                .first()
            )
            if not t:
                t = Topic(subject=subject, grade=grade, name=tn, description="")
                db.add(t)
                db.flush()
            for qd in result:
                correct = (qd.get("correct") or "A").strip().upper()
                if correct not in ("A", "B", "C", "D"):
                    correct = "A"
                try:
                    diff = float(qd.get("difficulty", 0.5))
                except Exception:
                    diff = 0.5
                q = Question(
                    topic_id=t.id,
                    content=qd.get("content", "").strip(),
                    option_a=qd.get("A", "").strip(),
                    option_b=qd.get("B", "").strip(),
                    option_c=qd.get("C", "").strip(),
                    option_d=qd.get("D", "").strip(),
                    correct_answer=correct,
                    explanation=(qd.get("explanation") or "").strip(),
                    difficulty=diff,
                )
                db.add(q)
                db.flush()
                questions.append(q)

    final_qs = questions[:target]
    new_test = Test(user_id=user_id, week=-2)
    db.add(new_test)
    db.flush()
    for q in final_qs:
        db.execute(test_questions.insert().values(test_id=new_test.id, question_id=q.id))
    db.commit()
    db.refresh(new_test)

    return TestOut(
        test_id=new_test.id,
        questions=[
            QuestionOut(
                id=q.id,
                content=q.content,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                topic_id=q.topic_id,
            )
            for q in final_qs
        ],
    )


# ──────────────────────────────────────────────
# Past Papers: history + per-test review
# ──────────────────────────────────────────────

@router.get("/history/{user_id}")
def get_test_history(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Return a user's past tests sorted newest-first with scores and weak-topic summaries."""
    from sqlalchemy import exists as sa_exists
    # Only include tests that were actually submitted (have at least one UserAnswer for this user)
    has_answers = (
        db.query(UserAnswer.test_id)
        .filter(UserAnswer.test_id == Test.id, UserAnswer.user_id == user_id)
        .correlate(Test)
        .exists()
    )
    tests = (
        db.query(Test)
        .filter(Test.user_id == user_id, has_answers)
        .order_by(Test.created_at.desc())
        .limit(limit)
        .all()
    )

    records = []
    for test in tests:
        answers = db.query(UserAnswer).filter(UserAnswer.test_id == test.id, UserAnswer.user_id == user_id).all()
        total = len(answers)
        correct = sum(1 for a in answers if a.is_correct)

        # Collect weak topic names from wrong answers
        seen_topics: set[str] = set()
        weak: list[str] = []
        for a in answers:
            if a.is_correct:
                continue
            q = db.query(Question).filter(Question.id == a.question_id).first()
            if q:
                t = db.query(Topic).filter(Topic.id == q.topic_id).first()
                if t and t.name and t.name not in seen_topics:
                    seen_topics.add(t.name)
                    weak.append(t.name)

        # Derive topic_name from the first question's topic
        topic_name: str | None = None
        if test.questions:
            first_q = test.questions[0]
            t = db.query(Topic).filter(Topic.id == first_q.topic_id).first()
            if t:
                topic_name = t.name

        # week=-1 → entrance/general test; week>=0 → mini test (0=redemption/no-week, >0=roadmap week N)
        is_mini = test.week is not None and test.week >= 0
        records.append({
            "test_id": test.id,
            "score": test.score,
            "week": test.week,
            "created_at": test.created_at.isoformat() if test.created_at else None,
            "total_questions": total,
            "correct_count": correct,
            "is_mini_test": is_mini,
            "topic_name": topic_name,
            "weak_topics": weak,
        })

    return {"status": "success", "data": records}


@router.get("/{test_id}/review")
def get_test_review(test_id: int, user_id: int, db: Session = Depends(get_db)):
    """Return every answer for a past test (question text, options, correct answer, explanation)."""
    answers = (
        db.query(UserAnswer)
        .filter(UserAnswer.test_id == test_id, UserAnswer.user_id == user_id)
        .all()
    )
    items = []
    for a in answers:
        q = db.query(Question).filter(Question.id == a.question_id).first()
        t = db.query(Topic).filter(Topic.id == q.topic_id).first() if q else None
        items.append({
            "question_id": a.question_id,
            "content": q.content if q else "",
            "option_a": q.option_a if q else "",
            "option_b": q.option_b if q else "",
            "option_c": q.option_c if q else "",
            "option_d": q.option_d if q else "",
            "correct_answer": q.correct_answer if q else "",
            "selected_option": a.selected_option,
            "is_correct": a.is_correct,
            "explanation": q.explanation if q else "",
            "topic": t.name if t else "",
        })
    return {"status": "success", "data": items}
