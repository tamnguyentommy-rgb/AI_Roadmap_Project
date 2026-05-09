"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api, { Question, TestOut } from "../../src/lib/api";

const EXAM_DURATION = 90 * 60;
const OPTIONS = ["A", "B", "C", "D"] as const;

const SUBJECT_COLORS: Record<string, string> = {
  Toán: "linear-gradient(135deg, #3b82f6, #6366f1)",
  Lý: "linear-gradient(135deg, #f59e0b, #ef4444)",
  Hóa: "linear-gradient(135deg, #10b981, #06b6d4)",
  Sinh: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
};

type Phase = "loading" | "start" | "generating" | "exam" | "submitting" | "results";

export default function MockExamPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [test, setTest] = useState<TestOut | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState(12);
  const [showNav, setShowNav] = useState(false);
  const [genStep, setGenStep] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  const GEN_STEPS = [
    "Lấy câu hỏi từ ngân hàng đề...",
    "AI đang soạn câu hỏi bổ sung...",
    "Phân bố chủ đề đề thi...",
    "Hoàn thiện đề thi 50 câu...",
  ];

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    api.getConfig(user.id)
      .then((res) => {
        const config = res.data?.data ?? res.data;
        if (config?.subject) setSubject(config.subject);
        if (config?.grade) setGrade(config.grade);
      })
      .catch(() => {})
      .finally(() => setPhase("start"));
  }, [isLoaded, user]);

  useEffect(() => {
    if (phase !== "generating") return;
    let step = 0;
    const iv = setInterval(() => {
      step = Math.min(step + 1, GEN_STEPS.length - 1);
      setGenStep(step);
    }, 4000);
    return () => clearInterval(iv);
  }, [phase]);

  const startTimer = useCallback(() => {
    const stored = sessionStorage.getItem("mockExamStart");
    if (stored) {
      startTimeRef.current = parseInt(stored);
    } else {
      startTimeRef.current = Date.now();
      sessionStorage.setItem("mockExamStart", String(startTimeRef.current));
    }

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      const remaining = Math.max(0, EXAM_DURATION - elapsed);
      setTimeLeft(Math.floor(remaining));
      if (remaining <= 0 && !submittingRef.current) {
        submittingRef.current = true;
        doSubmit(true);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => {
    if (phase !== "exam") return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTimer]);

  const startExam = async () => {
    if (!user) return;
    setPhase("generating");
    setGenStep(0);
    try {
      const res = await api.generateMockExam(user.id);
      setTest(res.data);
      sessionStorage.removeItem("mockExamStart");
      startTimeRef.current = null;
      setPhase("exam");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Lỗi tạo đề thi — thử lại sau!");
      setPhase("start");
    }
  };

  const doSubmit = async (autoSubmit = false) => {
    if (!test || !user) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setShowConfirm(false);
    setPhase("submitting");
    try {
      const payload = test.questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] || "A",
      }));
      const res = await api.submitTest(user.id, test.test_id, payload, {
        is_mini_test: false,
        week: -2,
      });
      sessionStorage.removeItem("mockExamStart");
      setResults({ ...res.data, autoSubmit });
      setPhase("results");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Lỗi nộp bài — thử lại!");
      setPhase("exam");
      submittingRef.current = false;
    }
  };

  const pick = (qId: number, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const subjectGradient = SUBJECT_COLORS[subject] || SUBJECT_COLORS["Toán"];
  const totalQ = test?.questions.length || 50;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQ - answeredCount;
  const isRed = timeLeft < 300;
  const isYellow = timeLeft < 900 && !isRed;

  // ── LOADING ──────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center noise-bg" style={{ background: "#07080f" }}>
      <div className="dot-loader flex gap-1"><span /><span /><span /></div>
    </div>
  );

  // ── GENERATING ───────────────────────────────────────────────
  if (phase === "generating") return (
    <div className="min-h-screen flex items-center justify-center noise-bg" style={{ background: "#07080f" }}>
      <div className="text-center max-w-xs px-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 animate-float"
          style={{ background: subjectGradient, boxShadow: "0 16px 48px rgba(245,158,11,0.35)" }}>
          📝
        </div>
        <div className="dot-loader flex justify-center gap-1 mb-4"><span /><span /><span /></div>
        <p className="text-white font-black text-lg mb-2">Đang chuẩn bị đề thi</p>
        <p className="text-sm mb-6" style={{ color: "#a78bfa" }}>{GEN_STEPS[genStep]}</p>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${((genStep + 1) / GEN_STEPS.length) * 100}%`, background: subjectGradient }} />
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          AI đang soạn câu hỏi — có thể mất 30–60 giây
        </p>
      </div>
    </div>
  );

  // ── SUBMITTING ───────────────────────────────────────────────
  if (phase === "submitting") return (
    <div className="min-h-screen flex items-center justify-center noise-bg" style={{ background: "#07080f" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 animate-float"
          style={{ background: subjectGradient }}>
          📤
        </div>
        <div className="dot-loader flex justify-center gap-1 mb-3"><span /><span /><span /></div>
        <p className="text-white font-bold">Đang nộp bài...</p>
      </div>
    </div>
  );

  // ── START SCREEN ─────────────────────────────────────────────
  if (phase === "start") return (
    <div className="min-h-screen pb-12 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -220, right: -200, background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 450, height: 450, bottom: -160, left: -130, background: "radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%)", zIndex: 0 }} />
      <div className="relative z-10">
      <div className="max-w-md mx-auto px-4 pt-10">
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm mb-8 group"
          style={{ color: "#475569" }}>
          <span className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white">←</span>
          <span className="transition-colors duration-200 group-hover:text-white">Về Dashboard</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 animate-float"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.14))", border: "1px solid rgba(245,158,11,0.28)", boxShadow: "0 0 50px rgba(245,158,11,0.15)" }}>
            📝
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#fbbf24", letterSpacing: "0.16em" }}>
            Mock Exam · THPT Format
          </p>
          <h1 className="text-white font-black text-2xl mb-1">Thi thử toàn đề</h1>
          <p className="text-sm font-medium" style={{ color: "#475569" }}>{subject} · Lớp {grade}</p>
        </div>

        <div className="glass-premium rounded-3xl p-5 mb-4 shimmer-border" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#fbbf24" }}>Thông tin đề thi</p>
          {[
            { icon: "📋", label: "Số câu hỏi", value: "50 câu MCQ" },
            { icon: "⏱", label: "Thời gian", value: "90 phút đếm ngược" },
            { icon: "🎯", label: "Thang điểm", value: "10 điểm (mỗi câu 0.2đ)" },
            { icon: "🔒", label: "Nộp bài", value: "1 lần duy nhất" },
            { icon: "🤖", label: "Câu hỏi", value: "DB + AI bổ sung" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2.5 border-b last:border-0"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
              <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>{item.label}</span>
              <span className="text-xs font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs font-bold" style={{ color: "#f87171" }}>
            ⚠ Lưu ý: Sau khi bắt đầu, đồng hồ chạy liên tục. Nếu thoát ra giữa chừng, đồng hồ vẫn đếm. Khi hết giờ, bài tự động nộp.
          </p>
        </div>

        <button onClick={startExam}
          className="w-full py-4 font-black text-white rounded-2xl text-base transition-all active:scale-98"
          style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 10px 40px rgba(245,158,11,0.35)" }}>
          Bắt đầu thi thử →
        </button>
        <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Đề sẽ được tạo trong ~30–60 giây
        </p>
      </div>
      </div>
    </div>
  );

  // ── RESULTS ──────────────────────────────────────────────────
  if (phase === "results" && results) {
    const score = results.score ?? 0;
    const correct = results.correct_count ?? 0;
    const total = results.total_questions ?? 50;
    const thptScore = parseFloat((score).toFixed(1));

    const getGrade = (s: number) => {
      if (s >= 9) return { label: "Xuất sắc", color: "#34d399" };
      if (s >= 8) return { label: "Giỏi", color: "#60a5fa" };
      if (s >= 6.5) return { label: "Khá", color: "#a78bfa" };
      if (s >= 5) return { label: "Trung bình", color: "#fbbf24" };
      return { label: "Cần cố gắng", color: "#f87171" };
    };
    const gradeLabel = getGrade(thptScore);

    const topicBreakdown: Record<string, { correct: number; total: number }> = {};
    (results.results || []).forEach((r: any) => {
      const t = r.topic || "Khác";
      if (!topicBreakdown[t]) topicBreakdown[t] = { correct: 0, total: 0 };
      topicBreakdown[t].total += 1;
      if (r.is_correct) topicBreakdown[t].correct += 1;
    });

    return (
      <div className="min-h-screen pb-16 noise-bg" style={{ background: "#07080f" }}>
        <div className="max-w-md mx-auto px-4 pt-8">

          {results.autoSubmit && (
            <div className="rounded-2xl px-4 py-2.5 mb-4 text-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-bold" style={{ color: "#f87171" }}>⏰ Hết giờ — bài đã được tự động nộp</p>
            </div>
          )}

          {/* Score hero */}
          <div className="glass rounded-3xl p-8 mb-4 text-center relative overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: subjectGradient }} />
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              📝 Kết quả Mock Exam · {subject} lớp {grade}
            </p>
            <p className="font-black mb-1 leading-none"
              style={{ fontSize: 72, background: subjectGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {thptScore.toFixed(1)}
            </p>
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>/ 10 điểm</p>
            <span className="text-sm font-black px-4 py-1.5 rounded-full" style={{ background: `${gradeLabel.color}22`, color: gradeLabel.color }}>
              {gradeLabel.label}
            </span>
            <div className="flex justify-center gap-6 mt-5">
              <div className="text-center">
                <p className="text-xl font-black" style={{ color: "#34d399" }}>{correct}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Đúng</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="text-center">
                <p className="text-xl font-black" style={{ color: "#f87171" }}>{total - correct}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sai</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="text-center">
                <p className="text-xl font-black" style={{ color: "#fbbf24" }}>{total}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tổng</p>
              </div>
            </div>
          </div>

          {/* Topic breakdown */}
          {Object.keys(topicBreakdown).length > 0 && (
            <div className="glass rounded-3xl p-5 mb-4" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Kết quả theo chủ đề
              </p>
              <div className="space-y-3">
                {Object.entries(topicBreakdown)
                  .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
                  .map(([topic, data]) => {
                    const pct = Math.round((data.correct / data.total) * 100);
                    const color = pct >= 70 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
                    return (
                      <div key={topic}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-white truncate max-w-[65%]">{topic}</p>
                          <p className="text-xs font-black" style={{ color }}>
                            {data.correct}/{data.total} ({pct}%)
                          </p>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Weak topics */}
          {results.weak_topics?.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#f87171" }}>⚠ Chủ đề cần ôn thêm:</p>
              <div className="flex flex-wrap gap-1.5">
                {results.weak_topics.slice(0, 6).map((t: string) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={() => { setPhase("start"); setTest(null); setAnswers({}); setCurrentQ(0); setResults(null); submittingRef.current = false; }}
              className="w-full py-3.5 font-black text-white rounded-2xl text-sm transition-all active:scale-98"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 8px 24px rgba(245,158,11,0.3)" }}>
              Thi thử lại →
            </button>
            <button onClick={() => router.push("/dashboard")}
              className="w-full py-3 font-semibold text-sm rounded-2xl transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
              Về Dashboard
            </button>
            <button onClick={() => router.push("/past-papers")}
              className="w-full py-3 font-semibold text-sm rounded-2xl transition-all"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a78bfa" }}>
              Xem lịch sử bài thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM ─────────────────────────────────────────────────────
  if (phase !== "exam" || !test) return null;
  const q = test.questions[currentQ];
  const selected = answers[q?.id];

  return (
    <div className="min-h-screen flex flex-col noise-bg" style={{ background: "#07080f" }}>

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-30 flex-shrink-0"
        style={{ background: "rgba(7,8,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">

          {/* Logo */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>R</div>

          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                Câu {currentQ + 1}/{totalQ}
              </p>
              <p className="text-[10px] font-bold" style={{ color: answeredCount === totalQ ? "#34d399" : "var(--text-muted)" }}>
                {answeredCount}/{totalQ} đã làm
              </p>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${((currentQ + 1) / totalQ) * 100}%`, background: subjectGradient }} />
            </div>
          </div>

          {/* Timer */}
          <div className="flex-shrink-0 px-3 py-1.5 rounded-xl text-center min-w-[72px]"
            style={{
              background: isRed ? "rgba(239,68,68,0.18)" : isYellow ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${isRed ? "rgba(239,68,68,0.35)" : isYellow ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <p className="text-[9px] font-bold uppercase" style={{ color: isRed ? "#f87171" : isYellow ? "#fbbf24" : "var(--text-muted)" }}>⏱ Còn</p>
            <p className="text-sm font-black tabular-nums" style={{ color: isRed ? "#f87171" : isYellow ? "#fbbf24" : "white" }}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </div>

      {/* ── QUESTION NAVIGATOR (collapsible) ── */}
      <div className="flex-shrink-0" style={{ borderBottom: showNav ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
        <button
          className="w-full flex items-center justify-between px-4 py-2 text-xs"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setShowNav(!showNav)}>
          <span>Câu hỏi {showNav ? "▲" : "▼"}</span>
          <span className="font-bold" style={{ color: unansweredCount > 0 ? "#fbbf24" : "#34d399" }}>
            {unansweredCount > 0 ? `${unansweredCount} chưa làm` : "Đã làm hết ✓"}
          </span>
        </button>

        {showNav && (
          <div className="max-w-md mx-auto px-4 pb-3">
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
              {test.questions.map((tq, i) => {
                const done = answers[tq.id] !== undefined;
                const isCur = i === currentQ;
                return (
                  <button
                    key={tq.id}
                    onClick={() => { setCurrentQ(i); setShowNav(false); }}
                    className="aspect-square rounded-lg text-[10px] font-black flex items-center justify-center transition-all"
                    style={{
                      background: isCur
                        ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                        : done
                          ? "rgba(52,211,153,0.2)"
                          : "rgba(255,255,255,0.05)",
                      color: isCur ? "white" : done ? "#34d399" : "var(--text-muted)",
                      border: isCur ? "none" : done ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── QUESTION BODY ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-5">

          {/* Question number + content */}
          <div className="glass rounded-3xl p-5 mb-4" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: subjectGradient }}>
                {currentQ + 1}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Câu hỏi
              </span>
            </div>
            <p className="text-white font-semibold text-sm leading-relaxed">{q?.content}</p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {OPTIONS.map((opt) => {
              const optText = q?.[`option_${opt.toLowerCase()}` as keyof Question] as string || "";
              const isSelected = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => pick(q.id, opt)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-98"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))"
                      : "rgba(255,255,255,0.04)",
                    border: isSelected
                      ? "1.5px solid rgba(245,158,11,0.5)"
                      : "1.5px solid rgba(255,255,255,0.07)",
                  }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                    style={{
                      background: isSelected ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "rgba(255,255,255,0.07)",
                      color: isSelected ? "white" : "var(--text-muted)",
                    }}>
                    {opt}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: isSelected ? "#fff" : "var(--text-secondary)" }}>
                    {optText}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="flex-shrink-0 sticky bottom-0"
        style={{ background: "rgba(7,8,15,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            className="px-4 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
            ← Trước
          </button>

          {currentQ < totalQ - 1 ? (
            <button
              onClick={() => setCurrentQ((c) => Math.min(totalQ - 1, c + 1))}
              className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-98"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Câu tiếp →
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-98"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
              Nộp bài →
            </button>
          )}

          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-3 rounded-2xl font-bold text-sm transition-all"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            Nộp
          </button>
        </div>
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div className="w-full max-w-md mx-auto rounded-t-3xl p-6"
            style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.08)", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
            <p className="text-white font-black text-lg mb-1 text-center">Xác nhận nộp bài?</p>
            <p className="text-sm text-center mb-5" style={{ color: "var(--text-muted)" }}>
              Bạn đã làm <strong className="text-white">{answeredCount}/{totalQ}</strong> câu
              {unansweredCount > 0 && (
                <span style={{ color: "#fbbf24" }}> · {unansweredCount} câu chưa làm sẽ tính sai</span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                Làm tiếp
              </button>
              <button onClick={() => doSubmit(false)}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white"
                style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", boxShadow: "0 6px 20px rgba(239,68,68,0.3)" }}>
                Nộp bài →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}