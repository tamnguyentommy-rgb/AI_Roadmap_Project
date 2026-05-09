"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/contexts/auth";
import api from "../../../src/lib/api";

const GRADES = [10, 11, 12];
const MODES = [
  { id: "general", label: "Học Toàn Diện", icon: "◎", desc: "Ôn toàn bộ chương trình, cân bằng lý thuyết và bài tập" },
  { id: "exam",    label: "Chuẩn bị Thi",  icon: "◈", desc: "Tập trung trọng tâm, luyện đề và các dạng bài thường gặp" },
];

const SUBJECT_META: Record<string, { gradient: string; glow: string; orb: string; border: string }> = {
  Toán: { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.35)", orb: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.4)" },
  Lý:   { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.35)", orb: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)" },
  Hóa:  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.35)", orb: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)" },
  Sinh: { gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)", glow: "rgba(20,184,166,0.35)", orb: "rgba(139,92,246,0.12)", border: "rgba(20,184,166,0.4)" },
};
const SUBJECT_ICONS: Record<string, string> = { Toán: "∑", Lý: "⚡", Hóa: "⬡", Sinh: "◉" };

export default function ConfigPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [grade, setGrade] = useState(12);
  const [mode, setMode] = useState("general");
  const [target, setTarget] = useState(8.0);
  const [daily, setDaily] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("Toán");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setSubject(sessionStorage.getItem("subject") || "Toán");
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (isLoaded && !user) router.push("/"); }, [isLoaded, user]);

  const meta = SUBJECT_META[subject] || SUBJECT_META["Toán"];

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true); setError("");
    try {
      await api.saveConfig(user.id, { subject, grade, mode, target_score: target, daily_study_time: daily });
      sessionStorage.setItem("grade", String(grade));
      sessionStorage.setItem("mode", mode);
      if (mode === "exam") {
        router.push("/onboarding/exam-date");
      } else {
        sessionStorage.setItem("examDurationWeeks", "26");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Lỗi khi lưu cài đặt!");
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = target >= 9.5 ? "Xuất sắc" : target >= 8.5 ? "Giỏi" : target >= 7.0 ? "Khá" : "Trung bình khá";
  const dailyLabel = daily >= 120 ? "Cường độ cao" : daily >= 75 ? "Vừa phải" : "Nhẹ nhàng";

  const gradientTextStyle: React.CSSProperties = {
    backgroundImage: meta.gradient,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    display: "inline-block",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}>

      <div className="aurora-orb" style={{ width: 480, height: 480, top: -180, right: -160, background: `radial-gradient(circle, ${meta.orb}, transparent 70%)` }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 360, height: 360, bottom: -140, left: -120, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)" }} />

      <div className="absolute top-0 left-0 right-0 h-px opacity-70 pointer-events-none"
        style={{ background: meta.gradient }} />

      <div className="relative z-10 w-full max-w-lg">

        <div className="text-center mb-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.55s cubic-bezier(0.4,0,0.2,1)" }}>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a78bfa" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {mode === "exam" ? "Bước 2 / 4" : "Bước 2 / 2"} &nbsp;·&nbsp; Thiết lập lộ trình
          </div>

          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl animate-float-slow"
              style={{ background: meta.gradient, boxShadow: `0 16px 48px ${meta.glow}`, width: 72, height: 72 }}>
              {SUBJECT_ICONS[subject] || "◎"}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Môn đã chọn</p>
              <h1 className="text-4xl font-black text-white leading-none">{subject}</h1>
            </div>
          </div>
        </div>

        <form
          onSubmit={handle}
          className="space-y-4"
          style={{
            opacity: visible ? 1 : 0,
            transition: "all 0.55s ease 0.1s",
            ["--slider-thumb-bg" as any]: meta.gradient,
            ["--slider-thumb-shadow" as any]: `0 0 16px ${meta.glow}`,
          }}>

          <div className="glass-premium rounded-2xl p-5">
            <label className="block text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Lớp học</label>
            <div className="grid grid-cols-3 gap-3">
              {GRADES.map(g => (
                <button key={g} type="button" onClick={() => setGrade(g)}
                  className="py-3.5 rounded-xl font-black text-base transition-all duration-200"
                  style={grade === g
                    ? { background: meta.gradient, color: "#fff", boxShadow: `0 8px 28px ${meta.glow}`, transform: "scale(1.04)" }
                    : { background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-5">
            <label className="block text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Mục tiêu học tập</label>
            <div className="space-y-3">
              {MODES.map(m => (
                <button key={m.id} type="button" onClick={() => setMode(m.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                  style={mode === m.id
                    ? { background: `linear-gradient(135deg, ${meta.orb}, rgba(99,102,241,0.08))`, border: `1px solid ${meta.border}`, boxShadow: `0 4px 20px ${meta.glow.replace("0.35","0.15")}` }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 transition-all duration-200"
                    style={mode === m.id
                      ? { background: meta.gradient, color: "#fff", boxShadow: `0 6px 20px ${meta.glow}` }
                      : { background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{m.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{m.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={mode === m.id
                      ? { background: meta.gradient, boxShadow: `0 2px 8px ${meta.glow}` }
                      : { border: "2px solid rgba(255,255,255,0.14)" }}>
                    {mode === m.id && <span className="text-white text-[10px] font-black">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Điểm mục tiêu</label>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black" style={gradientTextStyle}>
                  {target.toFixed(1)}
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{targetLabel}</span>
              </div>
            </div>
            <input type="range" min={5} max={10} step={0.5} value={target} onChange={e => setTarget(parseFloat(e.target.value))} className="w-full mt-3" />
            <div className="flex justify-between text-[10px] mt-2 font-semibold" style={{ color: "var(--text-muted)" }}>
              <span>5.0 · Trung bình</span><span>10.0 · Tối đa</span>
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Thời gian học/ngày</label>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black" style={gradientTextStyle}>
                  {daily}
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>phút · {dailyLabel}</span>
              </div>
            </div>
            <input type="range" min={30} max={180} step={15} value={daily} onChange={e => setDaily(parseInt(e.target.value))} className="w-full mt-3" />
            <div className="flex justify-between text-[10px] mt-2 font-semibold" style={{ color: "var(--text-muted)" }}>
              <span>30 phút</span><span>3 giờ</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-glow w-full py-4 font-black text-white rounded-2xl text-base disabled:opacity-50"
            style={{ background: meta.gradient, boxShadow: `0 12px 44px ${meta.glow}` }}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: "spin 1s linear infinite" }} />
                  Đang lưu...
                </span>
              : mode === "exam" ? "Tiếp theo →" : "Vào Dashboard →"}
          </button>

          <div className="flex justify-center gap-2.5 pt-1">
            <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
            <span className="h-1.5 w-12 rounded-full" style={{ background: meta.gradient, boxShadow: `0 0 8px ${meta.glow}` }} />
            {mode === "exam" && <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />}
            {mode === "exam" && <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />}
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
