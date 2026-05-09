"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";
import ReactMarkdown from "react-markdown";

const SUBJECT_COLORS: Record<string, string> = {
  Toán: "linear-gradient(135deg, #3b82f6, #6366f1)",
  Lý: "linear-gradient(135deg, #f59e0b, #ef4444)",
  Hóa: "linear-gradient(135deg, #10b981, #06b6d4)",
  Sinh: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
};

interface ChatMsg {
  role: "user" | "bot";
  text: string;
}

function MascotDisplay({ avatarData, size = 40 }: { avatarData: string | null; size?: number }) {
  if (!avatarData) {
    return (
      <div className="rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: size * 0.4 }}>
        R
      </div>
    );
  }
  return (
    <img src={avatarData} alt="Mascot" className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, border: "2px solid rgba(139,92,246,0.5)" }} />
  );
}

export default function TheoryPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState(12);
  const [weakSubtopics, setWeakSubtopics] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  // Tutor chat state
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<ChatMsg[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [mascotName, setMascotName] = useState("Gia sư AI");
  const [mascotPersonality, setMascotPersonality] = useState("coach");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    const tp = sessionStorage.getItem("theoryTopic") || "";
    const subj = sessionStorage.getItem("theorySubject") || "Toán";
    const gr = parseInt(sessionStorage.getItem("theoryGrade") || "12");
    const weakRaw = sessionStorage.getItem("theoryWeakTopics");
    let weak: string[] = [];
    try { if (weakRaw) weak = JSON.parse(weakRaw); } catch {}
    if (!tp) { router.push("/dashboard"); return; }
    setTopic(tp);
    setSubject(subj);
    setGrade(gr);
    setWeakSubtopics(weak);
    loadTheory(tp, subj, gr, weak);
    loadMascotInfo();
  }, [isLoaded, user]);

  useEffect(() => {
    if (tutorOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [tutorOpen, tutorMessages]);

  const loadMascotInfo = async () => {
    if (!user) return;
    try {
      const [avatarRes, mascotRes] = await Promise.all([
        api.getAvatar(user.id).catch(() => null),
        api.getMascot(user.id).catch(() => null),
      ]);
      if (avatarRes?.data?.avatar_data) setAvatarData(avatarRes.data.avatar_data);
      if (mascotRes?.data) {
        setMascotName(mascotRes.data.mascot_name || "Gia sư AI");
        setMascotPersonality(mascotRes.data.mascot_personality || "coach");
      }
    } catch {}
  };

  const loadTheory = async (tp: string, subj: string, gr: number, weak: string[]) => {
    setLoading(true);
    try {
      const res = await api.generateTheory(tp, subj, gr, weak);
      setContent(res.data.content);
      setTimeout(() => setVisible(true), 50);
    } catch {
      setContent(`# Lý thuyết: ${tp}\n\nChưa thể tải nội dung. Vui lòng thử lại.`);
      setTimeout(() => setVisible(true), 50);
    } finally {
      setLoading(false);
    }
  };

  const goToMiniTest = () => {
    sessionStorage.setItem("testTopic", topic);
    sessionStorage.setItem("theoryTopic", topic);
    const theoryWeek = sessionStorage.getItem("theoryWeek");
    if (theoryWeek) sessionStorage.setItem("testWeek", theoryWeek);
    router.push("/test");
  };

  const openTutor = () => {
    setTutorOpen(true);
    if (tutorMessages.length === 0) {
      const greeting: ChatMsg = {
        role: "bot",
        text: `Chào bạn! Mình là ${mascotName} — gia sư của bạn hôm nay. Mình đã đọc xong lý thuyết về **${topic}** rồi nhé. Bạn có câu hỏi gì về phần này không? Hay muốn mình giải thích thêm phần nào?`,
      };
      setTutorMessages([greeting]);
    }
  };

  const sendTutorMessage = async () => {
    const msg = tutorInput.trim();
    if (!msg || tutorLoading) return;
    const userMsg: ChatMsg = { role: "user", text: msg };
    setTutorMessages((prev) => [...prev, userMsg]);
    setTutorInput("");
    setTutorLoading(true);
    try {
      const res = await api.tutorChat({
        message: msg,
        theory_content: content || "",
        topic,
        subject,
        grade,
        user_id: user?.id,
        user_context: {
          username: user?.username || "bạn",
          mascot_name: mascotName,
          mascot_personality: mascotPersonality,
        },
        history: tutorMessages.map((m) => ({ role: m.role === "bot" ? "bot" : "user", text: m.text })),
      });
      const botMsg: ChatMsg = { role: "bot", text: res.data.reply };
      setTutorMessages((prev) => [...prev, botMsg]);
    } catch {
      setTutorMessages((prev) => [...prev, { role: "bot", text: "Xin lỗi, mình bị lỗi xíu. Thử lại nhé!" }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const gradient = SUBJECT_COLORS[subject] || SUBJECT_COLORS["Toán"];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden" style={{ background: "#07080f" }}>
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -200, right: -200, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)" }} />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6 animate-float"
          style={{ background: gradient, boxShadow: "0 0 50px rgba(99,102,241,0.45)" }}>
          📖
        </div>
        <div className="flex justify-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-white font-black text-base">AI đang soạn lý thuyết...</p>
        <p className="text-sm mt-1 font-medium" style={{ color: "#64748b" }}>{topic} · {subject} lớp {grade}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>

      {/* Aurora orbs */}
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -200, right: -200, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 400, height: 400, bottom: -150, left: -120, background: "radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)", zIndex: 0 }} />

      <div className="relative z-10">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-6 group"
          style={{ color: "#475569" }}>
          <span className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white">←</span>
          <span className="transition-colors duration-200 group-hover:text-white">Quay lại</span>
        </button>

        {/* Header */}
        <div className="mb-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "all 0.55s cubic-bezier(.22,1,.36,1)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: gradient, boxShadow: "0 6px 24px rgba(99,102,241,0.35)" }}>
              📖
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.22)" }}>
                Lý thuyết · AI tổng hợp
              </div>
              <p className="text-white font-black text-xl leading-tight">{topic}</p>
              <p className="text-xs font-medium" style={{ color: "#475569" }}>{subject} · Lớp {grade}</p>
            </div>
          </div>
          {weakSubtopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {weakSubtopics.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Theory content */}
        <div className="glass-premium rounded-3xl p-6 mb-5 relative overflow-hidden shimmer-border"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.55s cubic-bezier(.22,1,.36,1) 100ms" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: gradient }} />

          {content && (
            <div className="prose prose-invert prose-sm max-w-none"
              style={{ color: "var(--text-secondary)", lineHeight: 1.75 }}>
              <style>{`
                .prose h2 { color: #ffffff; font-size: 0.95rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
                .prose h3 { color: #e2e8f0; font-size: 0.875rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                .prose ul { margin: 0.5rem 0; padding-left: 1.25rem; }
                .prose li { margin: 0.3rem 0; }
                .prose strong { color: #e2e8f0; }
                .prose code { background: rgba(99,102,241,0.15); color: #c4b5fd; padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.85em; }
                .prose p { margin: 0.5rem 0; }
                .prose ol { margin: 0.5rem 0; padding-left: 1.25rem; }
              `}</style>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-3"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.5s ease 200ms" }}>
          <div className="glass rounded-3xl p-5 flex items-start gap-3"
            style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.15)" }}>💡</div>
            <div>
              <p className="text-white font-bold text-sm mb-1">Đã nắm lý thuyết chưa?</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Làm ngay Mini Test để kiểm tra mức độ hiểu — AI sẽ ra đề đúng với phần vừa học.
              </p>
            </div>
          </div>

          <button onClick={goToMiniTest}
            className="w-full py-4 font-black text-white rounded-2xl text-sm transition-all active:scale-98"
            style={{ background: gradient, boxShadow: "0 10px 40px rgba(99,102,241,0.3)" }}>
            Làm Mini Test ngay → {topic}
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="w-full py-3 font-semibold text-sm rounded-2xl transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
            Về Dashboard
          </button>
        </div>
      </div>
      </div>

      {/* ===== FLOATING TUTOR BUTTON ===== */}
      {!tutorOpen && (
        <button
          onClick={openTutor}
          className="fixed bottom-6 right-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl font-black text-white text-sm shadow-2xl transition-all active:scale-95 z-50"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
            animation: "float 3s ease-in-out infinite",
          }}>
          <MascotDisplay avatarData={avatarData} size={28} />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">Gia sư thực tế</span>
            <span>Hỏi {mascotName} →</span>
          </div>
        </button>
      )}

      {/* ===== TUTOR CHAT PANEL (slide-up) ===== */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out"
        style={{
          transform: tutorOpen ? "translateY(0)" : "translateY(100%)",
          height: "72vh",
          maxHeight: 600,
          background: "#0f1117",
          borderTop: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -16px 64px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}>

        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <MascotDisplay avatarData={avatarData} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-none">{mascotName}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#a78bfa" }}>
              Gia sư thực tế · {topic}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <button
              onClick={() => setTutorOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ overscrollBehavior: "contain" }}>
          {tutorMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "bot" && <MascotDisplay avatarData={avatarData} size={28} />}
              <div
                className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", borderRadius: "16px 4px 16px 16px" }
                  : { background: "rgba(255,255,255,0.06)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 16px 16px 16px" }
                }>
                {msg.text}
              </div>
            </div>
          ))}
          {tutorLoading && (
            <div className="flex gap-2.5">
              <MascotDisplay avatarData={avatarData} size={28} />
              <div className="px-3.5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 16px 16px 16px" }}>
                <div className="dot-loader flex gap-1"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTutorMessage(); } }}
              placeholder={`Hỏi ${mascotName} về ${topic}...`}
              className="flex-1 px-4 py-3 rounded-2xl text-sm text-white bg-transparent outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}
            />
            <button
              onClick={sendTutorMessage}
              disabled={!tutorInput.trim() || tutorLoading}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", flexShrink: 0 }}>
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop when tutor open */}
      {tutorOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setTutorOpen(false)}
        />
      )}
    </div>
  );
}
