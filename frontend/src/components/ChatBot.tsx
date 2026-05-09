"use client";
import { useState, useRef, useEffect } from "react";
import api from "../lib/api";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface ChatBotProps {
  userContext?: object;
  avatarData?: string | null;
  mascotName?: string;
  mascotPersonality?: string;
}

const PERSONALITY_LABEL: Record<string, string> = {
  serious: "Gia sư nghiêm túc",
  funny: "Bạn thân hài hước",
  coach: "Huấn luyện viên",
};

const PERSONALITY_COLOR: Record<string, string> = {
  serious: "linear-gradient(135deg, #3b82f6, #6366f1)",
  funny: "linear-gradient(135deg, #f59e0b, #ef4444)",
  coach: "linear-gradient(135deg, #10b981, #06b6d4)",
};

function buildGreeting(mascotName: string, mascotPersonality: string): string {
  const name = mascotName || "Routex";
  switch (mascotPersonality) {
    case "serious":
      return `Xin chào em! Thầy là ${name}. Em cần hỏi gì về bài học không?`;
    case "funny":
      return `Ê mày! Tao là ${name}. Hỏi gì cứ hỏi, tao giải thích hết 😎`;
    case "coach":
    default:
      return `Chào bạn! Mình là ${name}! Hôm nay học gì, mình support ngay! 💪`;
  }
}

const MAX_HISTORY = 10;

function MascotAvatar({ avatarData, size = 36, gradient }: { avatarData?: string | null; size?: number; gradient: string }) {
  if (avatarData) {
    return (
      <img src={avatarData} alt="Mascot"
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: size, height: size, border: "1px solid rgba(255,255,255,0.12)" }} />
    );
  }
  return (
    <div className="rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
      style={{ width: size, height: size, background: gradient, fontSize: size * 0.35 }}>
      ◈
    </div>
  );
}

export default function ChatBot({ userContext = {}, avatarData, mascotName = "", mascotPersonality = "coach" }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = mascotName || "Routex AI";
  const gradient = PERSONALITY_COLOR[mascotPersonality] || PERSONALITY_COLOR.coach;
  const roleLabel = PERSONALITY_LABEL[mascotPersonality] || "Trợ lý học tập";

  // Rebuild greeting when mascot changes
  useEffect(() => {
    const greeting: Message = {
      role: "bot",
      text: buildGreeting(mascotName, mascotPersonality),
    };
    setMessages([greeting]);
  }, [mascotName, mascotPersonality]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, open]);

  const buildHistory = (currentMessages: Message[]): Message[] => {
    const greeting = buildGreeting(mascotName, mascotPersonality);
    return currentMessages
      .filter((m) => m.text !== greeting)
      .slice(-MAX_HISTORY);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");

    const prevMessages = messages;
    const userMsg: Message = { role: "user", text: msg };
    const nextMessages = [...prevMessages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = buildHistory(prevMessages);
      const contextWithMascot = {
        ...userContext,
        mascot_name: mascotName,
        mascot_personality: mascotPersonality,
      };
      const res = await api.chat(msg, contextWithMascot, history);
      setMessages((prev) => [...prev, { role: "bot", text: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Xin lỗi, mình đang bận xíu! Thử lại sau nhé." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([{ role: "bot", text: buildGreeting(mascotName, mascotPersonality) }]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-2xl flex items-center justify-center z-50 transition-all duration-200 active:scale-95 overflow-hidden"
        style={{
          background: open ? "rgba(239,68,68,0.15)" : gradient,
          boxShadow: open ? "0 8px 32px rgba(239,68,68,0.3)" : "0 8px 32px rgba(99,102,241,0.5)",
          border: open ? "1px solid rgba(239,68,68,0.3)" : "none",
        }}>
        {!open && avatarData ? (
          <img src={avatarData} alt="Mascot" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl text-white transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "none" }}>
            {open ? "✕" : "◈"}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-44 right-4 w-80 flex flex-col overflow-hidden z-50 rounded-3xl shadow-2xl animate-fade-up"
          style={{
            height: "440px",
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
          }}>

          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12))",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
            <MascotAvatar avatarData={avatarData} size={36} gradient={gradient} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs truncate" style={{ color: "#6ee7b7" }}>{roleLabel}</p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearHistory}
                title="Xóa lịch sử hội thoại"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                }}>
                ↺
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                {m.role === "bot" && (
                  <MascotAvatar avatarData={avatarData} size={24} gradient={gradient} />
                )}
                <div
                  className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? {
                          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                          color: "#fff",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--text-primary)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderBottomLeftRadius: "4px",
                        }
                  }>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-end gap-2">
                <MascotAvatar avatarData={avatarData} size={24} gradient={gradient} />
                <div
                  className="px-3.5 py-2.5 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderBottomLeftRadius: "4px",
                  }}>
                  <div className="dot-loader flex gap-1">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              className="flex gap-2 items-center rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={mascotPersonality === "funny" ? "Hỏi tao đi..." : mascotPersonality === "serious" ? "Em hỏi thầy..." : "Hỏi mình đi..."}
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder-slate-600"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-200 disabled:opacity-30"
                style={{ background: gradient }}>
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
