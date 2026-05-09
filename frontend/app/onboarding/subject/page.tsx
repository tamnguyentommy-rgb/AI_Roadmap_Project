"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/contexts/auth";
import { useEffect, useState } from "react";

const SUBJECTS = [
  {
    id: "Toán", label: "Toán học", emoji: "∑", tag: "Mathematics",
    desc: "Đại số · Hình học · Giải tích",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    glow: "rgba(59,130,246,0.4)",
    orb: "rgba(59,130,246,0.18)",
    border: "rgba(59,130,246,0.5)",
  },
  {
    id: "Lý", label: "Vật lý", emoji: "⚡", tag: "Physics",
    desc: "Cơ học · Điện từ · Quang học",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    glow: "rgba(245,158,11,0.4)",
    orb: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.5)",
  },
  {
    id: "Hóa", label: "Hóa học", emoji: "⬡", tag: "Chemistry",
    desc: "Vô cơ · Hữu cơ · Hóa lý",
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    glow: "rgba(16,185,129,0.4)",
    orb: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.5)",
  },
  {
    id: "Sinh", label: "Sinh học", emoji: "◉", tag: "Biology",
    desc: "Tế bào · Di truyền · Tiến hóa",
    gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
    glow: "rgba(20,184,166,0.4)",
    orb: "rgba(139,92,246,0.15)",
    border: "rgba(20,184,166,0.5)",
  },
];

export default function SubjectPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) router.push("/");
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [isLoaded, user]);

  const pick = (subject: string) => {
    setPicked(subject);
    sessionStorage.setItem("subject", subject);
    setTimeout(() => router.push("/onboarding/config"), 320);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 70% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 65%), #07080f" }}>

      {/* Aurora background */}
      <div className="aurora-orb" style={{ width: 500, height: 500, top: -180, left: -120, background: "radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%)" }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 400, height: 400, bottom: -140, right: -100, background: "radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)" }} />
      <div className="aurora-orb" style={{ width: 300, height: 300, top: "40%", left: "40%", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", animationDelay: "4s" }} />

      {/* Vertical light line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-56 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.5), transparent)" }} />

      <div className="relative z-10 w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(28px)",
            transition: "all 0.65s cubic-bezier(0.4,0,0.2,1)",
          }}>

          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold mb-7"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a78bfa", backdropFilter: "blur(12px)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Bước 1 / 2 &nbsp;·&nbsp; Chọn môn học
          </div>

          <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-none">
            Bạn muốn học<br />
            <span className="gradient-text">môn nào?</span>
          </h1>

          <p className="text-base" style={{ color: "#94a3b8" }}>
            {user && (
              <>Xin chào, <strong className="text-white">{user.username}</strong> ·{" "}</>
            )}
            Chọn một môn để Routex tạo lộ trình AI riêng cho bạn
          </p>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-2 gap-4">
          {SUBJECTS.map((sub, i) => {
            const isHovered = hovered === sub.id;
            const isPicked = picked === sub.id;

            return (
              <button key={sub.id} onClick={() => pick(sub.id)}
                onMouseEnter={() => setHovered(sub.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative overflow-hidden rounded-3xl p-7 text-left group"
                style={{
                  background: isHovered || isPicked
                    ? `linear-gradient(135deg, ${sub.orb.replace("0.15", "0.22")}, rgba(255,255,255,0.04))`
                    : "rgba(255,255,255,0.035)",
                  border: isHovered || isPicked
                    ? `1px solid ${sub.border}`
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isHovered || isPicked
                    ? `0 24px 64px ${sub.glow}, 0 0 0 1px ${sub.border}`
                    : "0 4px 24px rgba(0,0,0,0.3)",
                  transform: isPicked ? "scale(1.04)" : isHovered ? "translateY(-6px) scale(1.02)" : "none",
                  transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
                  opacity: visible ? 1 : 0,
                  transitionDelay: visible ? `${i * 70}ms` : "0ms",
                  backdropFilter: "blur(24px)",
                }}>

                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl transition-opacity duration-300"
                  style={{ background: sub.gradient, opacity: isHovered || isPicked ? 1 : 0.3 }} />

                {/* Glow orb in card */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at top right, ${sub.orb}, transparent 70%)`, opacity: isHovered || isPicked ? 1 : 0 }} />

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-6 transition-all duration-300"
                  style={{
                    background: sub.gradient,
                    boxShadow: isHovered || isPicked ? `0 12px 40px ${sub.glow}` : `0 6px 20px ${sub.glow.replace("0.4", "0.2")}`,
                    transform: isHovered || isPicked ? "scale(1.1) rotate(-2deg)" : "none",
                  }}>
                  {sub.emoji}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>{sub.tag}</p>
                    <h2 className="text-white font-black text-xl mb-2 leading-tight">{sub.label}</h2>
                    <p className="text-sm leading-snug" style={{ color: "#94a3b8" }}>{sub.desc}</p>
                  </div>

                  <div className="ml-3 flex-shrink-0 mb-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isHovered || isPicked ? sub.gradient : "rgba(255,255,255,0.06)",
                        boxShadow: isHovered || isPicked ? `0 4px 16px ${sub.glow}` : "none",
                        transform: isHovered || isPicked ? "scale(1) translateX(0)" : "scale(0.8) translateX(-6px)",
                        opacity: isHovered || isPicked ? 1 : 0,
                      }}>
                      <span className="text-white text-sm font-black">→</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2.5 mt-12">
          <span className="h-1.5 w-12 rounded-full" style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", boxShadow: "0 0 8px rgba(99,102,241,0.5)" }} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
