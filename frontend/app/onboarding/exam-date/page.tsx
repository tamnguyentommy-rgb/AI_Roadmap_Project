"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/contexts/auth";

const SUBJECT_META: Record<string, { gradient: string; glow: string; orb: string; border: string }> = {
  Toán: { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.35)", orb: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.4)" },
  Lý:   { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.35)", orb: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)" },
  Hóa:  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.35)", orb: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)" },
  Sinh: { gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)", glow: "rgba(20,184,166,0.35)", orb: "rgba(139,92,246,0.12)", border: "rgba(20,184,166,0.4)" },
};

const PRESETS = [
  { label: "2 tuần",  sublabel: "Gần rồi, tập trung tối đa!",   weeks: 2,  icon: "⚡", intensity: "MAX" },
  { label: "1 tháng", sublabel: "Vừa đủ ôn trọng tâm",           weeks: 4,  icon: "◈",  intensity: "HIGH" },
  { label: "2 tháng", sublabel: "Có thời gian xây nền",           weeks: 8,  icon: "◎",  intensity: "MED" },
  { label: "3 tháng", sublabel: "Ôn toàn diện + luyện đề",        weeks: 12, icon: "◉",  intensity: "STEADY" },
];

const INTENSITY_COLORS: Record<string, string> = {
  MAX:    "#f87171",
  HIGH:   "#fbbf24",
  MED:    "#60a5fa",
  STEADY: "#34d399",
};

export default function ExamDatePage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [subject, setSubject] = useState("Toán");
  const [selected, setSelected] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) { router.push("/"); return; }
    const subj = sessionStorage.getItem("subject") || "Toán";
    setSubject(subj);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [isLoaded, user]);

  const meta = SUBJECT_META[subject] || SUBJECT_META["Toán"];

  const getWeeksFromDate = (dateStr: string): number => {
    const exam = new Date(dateStr);
    const today = new Date();
    const diffMs = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  };

  const handleCustomDate = (val: string) => {
    setCustomDate(val);
    if (val) setSelected(getWeeksFromDate(val));
  };

  const handleContinue = () => {
    const weeks = selected ?? 4;
    sessionStorage.setItem("examDurationWeeks", String(weeks));
    router.push("/onboarding/topics");
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const canContinue = selected !== null && selected > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}>

      {/* Aurora */}
      <div className="aurora-orb" style={{ width: 440, height: 440, top: -160, right: -140, background: `radial-gradient(circle, ${meta.orb}, transparent 70%)` }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 360, height: 360, bottom: -120, left: -100, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)" }} />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-80 pointer-events-none"
        style={{ background: meta.gradient }} />

      <div className="relative z-10 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.55s cubic-bezier(0.4,0,0.2,1)" }}>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a78bfa" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Bước 3 / 4 &nbsp;·&nbsp; Thời gian ôn tập
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            Kỳ thi của bạn<br />
            <span style={{ background: meta.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              còn bao lâu?
            </span>
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Routex sẽ tạo lộ trình phù hợp với thời gian bạn có
          </p>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-2 gap-3 mb-4"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.55s ease 0.1s" }}>
          {PRESETS.map((p, i) => {
            const isActive = selected === p.weeks && !customDate;
            const intColor = INTENSITY_COLORS[p.intensity];
            return (
              <button key={p.weeks} type="button"
                onClick={() => { setSelected(p.weeks); setCustomDate(""); }}
                className="relative rounded-2xl p-5 text-left transition-all duration-250 overflow-hidden"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${meta.orb.replace("0.14","0.2")}, rgba(99,102,241,0.08))`, border: `1px solid ${meta.border}`, transform: "scale(1.03)", boxShadow: `0 10px 36px ${meta.glow}` }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: meta.gradient }} />
                )}

                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${intColor}22`, color: intColor, border: `1px solid ${intColor}44` }}>
                    {p.intensity}
                  </span>
                </div>
                <p className="font-black text-white text-xl leading-none mb-1.5">{p.label}</p>
                <p className="text-xs leading-snug" style={{ color: isActive ? "#a5b4fc" : "#64748b" }}>{p.sublabel}</p>

                {isActive && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: meta.gradient, boxShadow: `0 2px 8px ${meta.glow}` }}>
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom date picker */}
        <div className="glass-premium rounded-2xl p-5 mb-5"
          style={{ opacity: visible ? 1 : 0, transition: "all 0.55s ease 0.2s" }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
            Hoặc chọn ngày thi cụ thể
          </p>
          <input
            type="date"
            min={today}
            max={maxDateStr}
            value={customDate}
            onChange={e => handleCustomDate(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: customDate ? `1px solid ${meta.border}` : "1px solid rgba(255,255,255,0.1)",
              color: customDate ? "#f1f5f9" : "#64748b",
              colorScheme: "dark",
            }}
          />
          {customDate && selected && (
            <p className="text-xs mt-2.5 font-medium px-3 py-2 rounded-xl"
              style={{ background: `${meta.orb}`, color: "#a5b4fc", border: `1px solid ${meta.border.replace("0.4","0.2")}` }}>
              ◈ Còn khoảng{" "}
              <strong className="text-white">{selected} tuần</strong>
              {" "}({selected * 7} ngày) — lộ trình sẽ được điều chỉnh phù hợp
            </p>
          )}
        </div>

        {/* Continue button */}
        <button onClick={handleContinue} disabled={!canContinue}
          className="btn-glow w-full py-4 font-black text-white rounded-2xl text-base disabled:opacity-40"
          style={{
            background: canContinue ? meta.gradient : "rgba(255,255,255,0.08)",
            boxShadow: canContinue ? `0 12px 44px ${meta.glow}` : "none",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.55s ease 0.25s, background 0.2s, box-shadow 0.2s, transform 0.2s",
          }}>
          Làm bài kiểm tra đầu vào →
        </button>

        {/* Step dots */}
        <div className="flex justify-center gap-2.5 mt-8">
          <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          <span className="h-1.5 w-12 rounded-full" style={{ background: meta.gradient, boxShadow: `0 0 8px ${meta.glow}` }} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
        </div>
      </div>
    </div>
  );
}
