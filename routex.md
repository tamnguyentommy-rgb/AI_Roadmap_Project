# Routex — Personalized Learning Path System

## Overview
Routex is an AI-powered personalized learning system for Vietnamese high school students (Grades 10–12), covering Math, Physics, Chemistry, and Biology. It uses XGBoost for score prediction and Gemini/Groq/OpenAI for generating adaptive weekly study roadmaps and mascot messages.

## Features
- **SM-2 Spaced Repetition** — auto-schedules topic review; dashboard shows due cards
- **Mascot Personality** — users name their mascot, pick a personality (serious/funny/coach); ChatBot adopts the name, tone, and avatar
- **Daily Briefing** — AI-generated morning message cached in localStorage by date; prompt includes name, streak, days-to-exam, weakest topic + mastery %; sent to `POST /api/chat/mascot-message`
- **ChatBot Full Context** — chat() in llm_service receives `weak_topics_detail` (list of {topic, mastery}), `weakest_topic`, `weakest_mastery`, `streak`, `studied_today`, `days_left`; uses them to answer very specifically about the student's actual weak areas
- **Theory Page** (`/theory`) — after mini test with score < 7, results page shows "Xem lý thuyết" button; saves topic/subject/grade/weak_topics to sessionStorage; theory page calls `POST /api/chat/theory` → AI generates markdown with key concepts, examples, common mistakes, tips; button navigates to mini test
- **Results Page** — removed only "Làm lại tập trung vào điểm yếu" button; kept "Ôn lại tuần X → topic" per-topic buttons (spaced repetition) + "Làm lại Mini Test tuần X" for overlap topics (both restored); added "Xem lý thuyết" CTA when score < 7; overlap section now has both the mini test retry AND theory button
- **Past Papers** (`/past-papers`) — full test history page accessible from dashboard bottom nav (📋 Papers tab); shows stats (total, avg score, best score), filter by All/Mini/Entrance; each card shows score badge, topic, week, date, wrong topics; expandable to see wrong answer details (question content, selected vs correct, explanation excerpt) + "Làm lại" / "📖 Lý thuyết" actions; powered by `GET /api/tests/history/{user_id}` and `GET /api/tests/{test_id}/review`

## Architecture
- **Frontend**: Next.js 16 (port 5000) — `frontend/`
- **Backend**: FastAPI + Uvicorn (port 8000) — `backend/`
- **Database**: PostgreSQL (Replit built-in) via SQLAlchemy — `DATABASE_URL` env var set automatically
- **ML Engine**: XGBoost model at `backend/app/ml_models/`
- **AI Engine**: Training scripts and data in `ai_engine/`

## Running the Project
Two workflows run in parallel:
- **Backend API**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Start application**: `cd frontend && npm run dev` (port 5000)

The frontend proxies all `/api/*` and `/health` requests to the backend via `frontend/next.config.ts`.

## Key Files
- `backend/app/main.py` — FastAPI app entry point, CORS, DB init
- `backend/app/api/endpoints/` — Route handlers (auth, roadmap, tests, chat, dashboard)
- `backend/app/services/ml_service.py` — XGBoost score prediction
- `backend/app/services/llm_service.py` — Gemini/Groq/OpenAI study plan generation
- `backend/app/core/auth.py` — JWT authentication (uses `SESSION_SECRET` env var)
- `frontend/src/lib/api.tsx` — Axios client for all API calls
- `frontend/next.config.ts` — Next.js config with API proxy rewrites

## Environment Variables / Secrets
- `GEMINI_API_KEY` — Google Gemini API key (primary LLM)
- `GROQ_API_KEY` — Groq API key (fallback LLM)
- `OPENAI_API_KEY` — OpenAI API key (fallback LLM)
- `SESSION_SECRET` — JWT signing secret (defaults to a dev value if not set)

## User Flow
1. Sign up / Log in on the landing page
2. Onboarding: choose subject, grade, exam date, target score
3. Take a mini test to establish baseline mastery
4. XGBoost predicts outcomes for 3 study scenarios (Chill / Balanced / Breakout)
5. User picks a scenario; LLM generates a detailed weekly study plan
6. Dashboard: follow the plan, take weekly tests, track progress
7. AI Advisor chatbot provides real-time support

## VietJack Scraper (Question Bank)
- **Model**: `backend/app/models/scraper.py` — `ScrapedURL` table tracks crawled pages (dedup by URL)
- **Service**: `backend/app/services/scraper.py` — discovers topic URLs from index pages, parses MCQ HTML structure (`<strong>Câu N.</strong>` + `<section class="toggle">`), saves to DB
- **Admin API**: `backend/app/api/endpoints/admin.py` at `/api/admin/scrape` and `/api/admin/scrape/status`
- **Standalone runner**: `backend/run_scraper.py` — `python run_scraper.py [subject] [grade]`
- **Subjects covered**: Toán 10/11/12, Lý 10/11/12, Hóa 10/11/12, Sinh 10/11/12 (19 index pages, ~6,973 questions total)
- **Dedup**: Questions deduped by content equality per topic; URLs tracked so re-runs skip already-scraped pages
- **LLM fallback**: Only when answer letter missing from HTML toggle-content
- **Mini-test DB-first**: `generate_mini_test` now pulls from DB first (exact → fuzzy → broad pool), calls LLM only to fill remaining slots if DB has fewer than `limit` questions

## Test Week Sentinels
- `week=-2` → Mock Exam (50-question THPT format)
- `week=-1` → Entrance exam
- `week=0` → Redemption test
- `week>0` → Roadmap weekly mini test

## UI Design System — Aurora Nebula
- **Design language**: Deep dark `#07080f` base, animated aurora mesh blobs, premium glassmorphism, neon glow accents
- **Subject colors**: Toán=blue/indigo, Lý=amber/red, Hóa=emerald/cyan, Sinh=teal/violet
- **CSS classes** (in `globals.css`): `.aurora-orb`, `.aurora-orb-2`, `.glass-premium`, `.animate-float-slow`, `.animate-spin-slow`, `.animate-slide-up`, `.animate-pop-in`, `.btn-glow`, `.shimmer-border`
- **Fully redesigned pages**: `landing (page.tsx)`, `onboarding/subject`, `onboarding/config`, `onboarding/exam-date`, `test`, `dashboard`, `results`, `theory`, `roadmap`, `past-papers`, `mock-exam`
- **Bottom nav**: Active tab has indigo glow + top accent bar; Update button spins when loading; all `font-black` uppercase labels

## Dependencies
- **Python**: fastapi, uvicorn, sqlalchemy, psycopg2-binary, xgboost, pandas, scikit-learn, joblib, google-genai, openai, groq, passlib[bcrypt], python-jose[cryptography], python-docx, python-multipart, httpx, beautifulsoup4, lxml
- **Node**: next, react, tailwindcss, axios, animejs, react-markdown
