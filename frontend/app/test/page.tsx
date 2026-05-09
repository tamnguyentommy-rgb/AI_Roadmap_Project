"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api, { Question, TestOut } from "../../src/lib/api";

const OPTIONS = ["A", "B", "C", "D"] as const;

const SUBJECT_ICONS: Record<string, string> = { Toán: "∑", Lý: "⚡", Hóa: "⬡", Sinh: "◉" };
const SUBJECT_META: Record<string, { gradient: string; glow: string; orb: string; border: string; orb2: string }> = {
  Toán: { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.35)",  orb: "rgba(59,130,246,0.14)",  orb2: "rgba(99,102,241,0.10)",  border: "rgba(59,130,246,0.45)" },
  Lý:   { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.35)",  orb: "rgba(245,158,11,0.12)",  orb2: "rgba(239,68,68,0.08)",   border: "rgba(245,158,11,0.45)" },
  Hóa:  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.35)",  orb: "rgba(16,185,129,0.12)",  orb2: "rgba(6,182,212,0.08)",   border: "rgba(16,185,129,0.45)" },
  Sinh: { gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)", glow: "rgba(20,184,166,0.35)",  orb: "rgba(139,92,246,0.12)",  orb2: "rgba(20,184,166,0.09)",  border: "rgba(20,184,166,0.45)" },
};

export default function TestPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [test, setTest] = useState<TestOut | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState(12);
  const [topic, setTopic] = useState<string | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);
  const nextingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    const tp = sessionStorage.getItem("testTopic") || null;
    const wk = sessionStorage.getItem("testWeek");
    const weakRaw = sessionStorage.getItem("testWeakTopics");
    const selectedRaw = sessionStorage.getItem("selectedTopics");
    const wkNum = wk ? parseInt(wk) : null;
    let weakList: string[] = [];
    if (weakRaw) {
      try {
        const parsed = JSON.parse(weakRaw);
        weakList = Array.isArray(parsed) ? parsed : [];
      } catch { weakList = []; }
    }
    let selTopics: string[] = [];
    if (selectedRaw) {
      try {
        const parsed = JSON.parse(selectedRaw);
        selTopics = Array.isArray(parsed) ? parsed : [];
      } catch { selTopics = []; }
    }
    setTopic(tp);
    setWeek(wkNum);
    setWeakTopics(Array.isArray(weakList) ? weakList : []);
    if (selTopics.length > 0) setSelectedTopics(selTopics);
    api.getConfig(user.id).then((res) => {
      const config = res.data?.data ?? res.data;
      if (!config?.subject || !config?.grade) {
        setError("Không tìm thấy cấu hình môn học. Vui lòng hoàn thành onboarding.");
        setLoading(false);
        return;
      }
      setSubject(config.subject);
      setGrade(config.grade);
      loadTest(config.subject, config.grade, tp, wkNum, Array.isArray(weakList) ? weakList : [], selTopics);
    }).catch(() => {
      setError("Không thể tải cấu hình môn học. Vui lòng thử lại.");
      setLoading(false);
    });
  }, [isLoaded, user]);

  const loadTest = async (
    subj = subject, gr = grade,
    tp: string | null = topic,
    wk: number | null = week,
    weak: string[] = weakTopics,
    selTopics: string[] = selectedTopics,
  ) => {
    setLoading(true); setError("");
    try {
      const res = tp
        ? await api.generateMiniTest(subj, gr, tp, user!.id, wk ?? undefined, weak.length ? weak : undefined)
        : await api.generateTest(subj, gr, undefined, selTopics.length ? selTopics : undefined);
      setTest(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Lỗi tải đề thi!");
    } finally {
      setLoading(false);
    }
  };

  const pick = (opt: string) => {
    if (animating) return;
    setSelected(opt);
    setShowNext(true);
  };

  const next = () => {
    if (!test || selected === null || nextingRef.current) return;
    nextingRef.current = true;
    setAnimating(true);
    setCardVisible(false);

    const q = test.questions[current];
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    setTimeout(() => {
      setSelected(null);
      setShowNext(false);
      setAnimating(false);
      nextingRef.current = false;
      if (current + 1 < test.questions.length) {
        setCurrent(c => c + 1);
        setTimeout(() => setCardVisible(true), 60);
      } else {
        submitTest(newAnswers);
      }
    }, 260);
  };

  const submitTest = async (finalAnswers: Record<number, string>) => {
    if (!test || !user) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(finalAnswers).map(([qid, ans]) => ({
        question_id: parseInt(qid), selected_answer: ans,
      }));
      const isMini = !!topic;
      const res = await api.submitTest(user.id, test.test_id, payload, isMini ? {
        is_mini_test: true, topic_name: topic || undefined, week: week ?? undefined,
      } : undefined);
      const questionMetaById = new Map(
        test.questions.map((question) => [question.id, {
          question_id: question.id, content: question.content, topic: topic || null,
          options: { A: question.option_a || "", B: question.option_b || "", C: question.option_c || "", D: question.option_d || "" },
        }]),
      );
      const question_details = res.data.results.map((item: any) => (
        questionMetaById.get(item.question_id) || { question_id: item.question_id }
      ));
      sessionStorage.setItem("testResult", JSON.stringify({ ...res.data, is_mini_test: isMini, topic_name: topic, week, question_details }));
      sessionStorage.removeItem("testTopic");
      sessionStorage.removeItem("testWeek");
      sessionStorage.removeItem("testWeakTopics");
      router.push("/results");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Lỗi nộp bài!");
      setSubmitting(false);
    }
  };

  const meta = SUBJECT_META[subject] || SUBJECT_META["Toán"];
  const isMiniTest = !!topic;

  /* ── Loading / Submitting ── */
  if (loading || submitting) return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}>
      <div className="aurora-orb" style={{ width: 500, height: 500, top: -200, right: -160, background: `radial-gradient(circle, ${meta.orb}, transparent 70%)` }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 380, height: 380, bottom: -160, left: -120, background: `radial-gradient(circle, ${meta.orb2}, transparent 70%)` }} />

      <div className="relative z-10 text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-3xl animate-float-slow"
            style={{ background: meta.gradient, boxShadow: `0 24px 64px ${meta.glow}` }} />
          <div className="absolute inset-0 rounded-3xl flex items-center justify-center text-4xl font-black text-white">
            {submitting ? "◎" : SUBJECT_ICONS[subject] || "◎"}
          </div>
          {/* Orbiting ring */}
          <div className="absolute -inset-3 rounded-full border border-dashed opacity-30 animate-spin-slow"
            style={{ borderColor: meta.border }} />
        </div>
        <div className="dot-loader mb-5 flex justify-center gap-1">
          <span style={{ background: "#6366f1" }} /><span style={{ background: "#8b5cf6" }} /><span style={{ background: "#a78bfa" }} />
        </div>
        <p className="text-white font-black text-xl mb-2">
          {submitting ? "AI đang phân tích bài làm..." : "Đang tải đề thi..."}
        </p>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          {submitting ? "Routex đang đánh giá điểm mạnh · điểm yếu" : `${subject} · Lớp ${grade}${topic ? ` · ${topic}` : ""}`}
        </p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}>
      <div className="aurora-orb" style={{ width: 400, height: 400, top: -140, right: -100, background: "radial-gradient(circle, rgba(239,68,68,0.10), transparent 70%)" }} />
      <div className="relative z-10 text-center max-w-sm">
        <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", width: 72, height: 72 }}>
          ⚠
        </div>
        <p className="text-white font-black text-xl mb-2">Không tải được đề thi</p>
        <p className="text-sm mb-7" style={{ color: "#94a3b8" }}>{error}</p>
        <button onClick={() => loadTest()}
          className="btn-glow px-8 py-3 rounded-2xl font-black text-white text-sm"
          style={{ background: meta.gradient, boxShadow: `0 10px 32px ${meta.glow}` }}>
          Thử lại
        </button>
      </div>
    </div>
  );

  if (!test) return null;

  const q = test.questions[current];
  const progress = (current / test.questions.length) * 100;
  const progressFull = ((current + 1) / test.questions.length) * 100;
  const optMap: Record<string, string | undefined> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
  const answered = Object.keys(answers).length;
  const totalQ = test.questions.length;

  /* ── Main test UI ── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}>

      {/* Aurora mesh */}
      <div className="aurora-orb" style={{ width: 480, height: 480, top: -200, right: -160, background: `radial-gradient(circle, ${meta.orb}, transparent 70%)` }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 400, height: 400, bottom: -160, left: -140, background: `radial-gradient(circle, ${meta.orb2}, transparent 70%)` }} />
      <div className="aurora-orb" style={{ width: 280, height: 280, top: "50%", left: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)", animationDelay: "5s" }} />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: meta.gradient, opacity: 0.7, boxShadow: `0 0 12px ${meta.glow}` }} />

      <div className="relative z-10 w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-lg"
              style={{ background: meta.gradient, boxShadow: `0 6px 20px ${meta.glow}` }}>
              {SUBJECT_ICONS[subject] || "◎"}
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">{subject} · Lớp {grade}</p>
              {isMiniTest
                ? <p className="text-xs font-bold" style={{ color: "#a78bfa" }}>Mini Test: {topic}</p>
                : <p className="text-xs" style={{ color: "var(--text-muted)" }}>{answered} / {totalQ} đã trả lời</p>
              }
            </div>
          </div>

          {/* Question counter */}
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" strokeWidth="2.5"
                  stroke={`url(#prog-${subject})`}
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
                <defs>
                  <linearGradient id={`prog-${subject}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={meta.gradient.includes("#3b82f6") ? "#3b82f6" : meta.gradient.includes("#f59e0b") ? "#f59e0b" : meta.gradient.includes("#10b981") ? "#10b981" : "#14b8a6"} />
                    <stop offset="100%" stopColor={meta.gradient.includes("#6366f1") ? "#6366f1" : meta.gradient.includes("#ef4444") ? "#ef4444" : meta.gradient.includes("#06b6d4") ? "#06b6d4" : "#8b5cf6"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-black text-sm leading-none">{current + 1}</span>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>/ {totalQ}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressFull}%`,
              background: meta.gradient,
              boxShadow: `0 0 10px ${meta.glow}`,
            }} />
        </div>

        {/* Question card */}
        <div className="glass-premium rounded-3xl p-7 mb-4 transition-all duration-260"
          style={{
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? "none" : "translateY(16px) scale(0.97)",
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)`,
          }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: `${meta.orb}`, border: `1px solid ${meta.border.replace("0.45","0.25")}`, color: "#a78bfa" }}>
              Câu {current + 1}
            </span>
            {isMiniTest && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>
                Mini Test
              </span>
            )}
          </div>
          <p className="text-white text-base leading-relaxed font-medium">{q.content}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-6"
          style={{ opacity: cardVisible ? 1 : 0, transition: "opacity 0.2s ease" }}>
          {OPTIONS.map((opt, oi) => {
            const txt = optMap[opt];
            if (!txt) return null;
            const isSelected = selected === opt;
            return (
              <button key={opt} onClick={() => pick(opt)}
                disabled={animating}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 group"
                style={isSelected
                  ? {
                      background: `linear-gradient(135deg, ${meta.orb.replace("0.14", "0.25")}, rgba(99,102,241,0.10))`,
                      border: `1.5px solid ${meta.border}`,
                      transform: "scale(1.01)",
                      boxShadow: `0 8px 28px ${meta.glow.replace("0.35","0.2")}`,
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      backdropFilter: "blur(16px)",
                    }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-all duration-200"
                  style={isSelected
                    ? { background: meta.gradient, color: "#fff", boxShadow: `0 6px 20px ${meta.glow}` }
                    : { background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                  {opt}
                </div>
                <span className="text-sm leading-snug font-medium flex-1"
                  style={{ color: isSelected ? "#ffffff" : "#e2e8f0" }}>
                  {txt}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.gradient }}>
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {showNext && (
          <button onClick={next} disabled={nextingRef.current}
            className="btn-glow w-full py-4 font-black text-white rounded-2xl text-sm animate-slide-up"
            style={{ background: meta.gradient, boxShadow: `0 12px 44px ${meta.glow}` }}>
            {current + 1 === totalQ
              ? "Nộp bài & Xem kết quả →"
              : `Câu tiếp theo (${current + 2}/${totalQ}) →`}
          </button>
        )}

        {/* Bottom hint */}
        {!showNext && (
          <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            Chọn một đáp án để tiếp tục
          </p>
        )}
      </div>
    </div>
  );
}
