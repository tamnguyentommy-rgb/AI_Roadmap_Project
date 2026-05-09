"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../src/contexts/auth";
import api from "../src/lib/api";

// ─── Static data ──────────────────────────────────────────────

const FEATURES = [
  { icon: "🗺", title: "Lộ trình cá nhân hoá", desc: "Routex phân tích mục tiêu, thời gian và năng lực để tạo kế hoạch học theo tuần — không copy-paste cho mọi học sinh.", color: "#3b82f6" },
  { icon: "📊", title: "Đánh giá thích nghi", desc: "Mini-test hàng tuần tự động phát hiện điểm yếu và điều chỉnh độ khó, giúp bạn cải thiện đúng chỗ cần cải thiện.", color: "#8b5cf6" },
  { icon: "🤖", title: "Gia sư AI 24/7", desc: "Hỏi bất cứ câu gì khi đọc lý thuyết — AI trả lời tức thì, có context, không cần tìm kiếm thêm.", color: "#10b981" },
  { icon: "📝", title: "Thi thử THPT", desc: "50 câu, 90 phút, thang điểm 10. Đề được tạo từ ngân hàng câu hỏi + AI bổ sung, sát đề thi thật.", color: "#f59e0b" },
  { icon: "🔁", title: "Ôn tập thông minh (SM-2)", desc: "Hệ thống nhắc bạn ôn đúng lúc sắp quên, dựa trên thuật toán Spaced Repetition khoa học.", color: "#ec4899" },
  { icon: "🌅", title: "Briefing hàng ngày", desc: "Mỗi sáng có tóm tắt tiến độ và gợi ý học cho ngày hôm nay từ mascot AI của bạn.", color: "#06b6d4" },
];

const STEPS = [
  { num: "01", title: "Tạo tài khoản", desc: "Đăng ký miễn phí trong 30 giây, không cần thẻ tín dụng." },
  { num: "02", title: "Cấu hình mục tiêu", desc: "Chọn môn, lớp, điểm mục tiêu và thời gian học mỗi ngày." },
  { num: "03", title: "Bắt đầu học", desc: "Routex tạo lộ trình và mini-test ngay, bắt đầu từ hôm nay." },
];

const TESTIMONIALS = [
  {
    name: "Nguyễn Minh Anh",
    grade: "Lớp 12 · Hóa học",
    avatar: "M",
    color: "linear-gradient(135deg, #10b981, #06b6d4)",
    before: 6.0,
    after: 8.5,
    quote: "Trước đây mình hay học lan man, không biết tập trung vào phần nào. Routex giúp mình có kế hoạch rõ ràng theo tuần, điểm thi thử tăng từ 6.0 lên 8.5 sau 2 tháng!",
  },
  {
    name: "Trần Bảo Long",
    grade: "Lớp 11 · Vật lý",
    avatar: "B",
    color: "linear-gradient(135deg, #f59e0b, #ef4444)",
    before: 5.5,
    after: 7.5,
    quote: "Mini-test hàng tuần cực kỳ hữu ích — nó chỉ đúng chỗ mình chưa hiểu. Gia sư AI giải thích rất dễ hiểu, không cần đi học thêm tốn tiền.",
  },
  {
    name: "Phạm Thu Hà",
    grade: "Lớp 12 · Toán",
    avatar: "H",
    color: "linear-gradient(135deg, #3b82f6, #6366f1)",
    before: 7.0,
    after: 9.0,
    quote: "Tính năng streak giúp mình duy trì thói quen học mỗi ngày. Lộ trình AI của Routex giúp mình ôn đúng trọng tâm, thi thật đạt 9.0!",
  },
];

const FAQ_ITEMS = [
  {
    q: "Routex có phù hợp với học sinh lớp 10 không?",
    a: "Có! Routex hỗ trợ đầy đủ chương trình lớp 10, 11 và 12 cho 4 môn Toán, Lý, Hóa, Sinh. Bạn chọn lớp và môn khi thiết lập, lộ trình sẽ được tùy chỉnh theo đúng chương trình của bạn.",
  },
  {
    q: "Tôi cần học bao lâu mỗi ngày để có hiệu quả?",
    a: "Routex linh hoạt theo thời gian bạn có — từ 30 phút đến 3 giờ mỗi ngày. Hệ thống sẽ tạo kế hoạch phù hợp với khung giờ bạn cài đặt, đảm bảo tập trung đúng trọng tâm.",
  },
  {
    q: "Routex khác gì so với học trên YouTube hay sách giáo khoa?",
    a: "YouTube và sách thụ động — bạn xem nhưng không biết mình hiểu đến đâu. Routex chủ động: mini-test phát hiện lỗ hổng, lộ trình điều chỉnh theo năng lực thực tế, và AI nhắc đúng lúc bạn sắp quên.",
  },
  {
    q: "Dữ liệu câu hỏi từ đâu? Có sát đề thật không?",
    a: "Ngân hàng câu hỏi được thu thập từ các nguồn SGK chính thống (VietJack, Thi247) và bổ sung bởi AI. Đề thi thử THPT được chuẩn format 50 câu, 90 phút, thang điểm 10 theo đúng chuẩn Bộ GD&ĐT.",
  },
  {
    q: "Routex có miễn phí không?",
    a: "Hiện tại Routex đang trong giai đoạn beta và hoàn toàn miễn phí. Bạn có thể tạo tài khoản và sử dụng đầy đủ tính năng mà không cần thẻ tín dụng.",
  },
  {
    q: "Tôi có thể học nhiều môn cùng lúc không?",
    a: "Hiện tại mỗi tài khoản tập trung vào 1 môn để đảm bảo lộ trình chuyên sâu nhất. Chúng tôi đang phát triển tính năng học đa môn trong các phiên bản sắp tới.",
  },
];

const CURRICULUM_PREVIEW: Record<string, Record<number, { chapter: string; topics: string[] }[]>> = {
  Toán: {
    10: [
      { chapter: "Mệnh đề và tập hợp", topics: ["Mệnh đề logic", "Tập hợp và các phép toán", "Số gần đúng"] },
      { chapter: "Hàm số và đồ thị", topics: ["Hàm số bậc nhất", "Hàm số bậc hai", "Đồ thị hàm số"] },
      { chapter: "Phương trình & bất phương trình", topics: ["Phương trình quy về bậc nhất", "Hệ phương trình", "Bất phương trình bậc hai"] },
    ],
    11: [
      { chapter: "Hàm số lượng giác", topics: ["Hàm sin, cos, tan, cot", "Đồ thị hàm lượng giác", "Phương trình lượng giác"] },
      { chapter: "Tổ hợp và xác suất", topics: ["Quy tắc đếm", "Hoán vị - Chỉnh hợp - Tổ hợp", "Xác suất cơ bản"] },
      { chapter: "Dãy số và cấp số", topics: ["Dãy số tổng quát", "Cấp số cộng", "Cấp số nhân"] },
    ],
    12: [
      { chapter: "Ứng dụng đạo hàm", topics: ["Sự đồng biến, nghịch biến", "Cực trị hàm số", "Tiệm cận & đồ thị"] },
      { chapter: "Tích phân", topics: ["Nguyên hàm", "Tích phân xác định", "Ứng dụng tích phân"] },
      { chapter: "Hình học không gian", topics: ["Đường thẳng & mặt phẳng", "Khối đa diện", "Mặt tròn xoay"] },
    ],
  },
  Lý: {
    10: [
      { chapter: "Động học chất điểm", topics: ["Chuyển động thẳng đều", "Chuyển động thẳng biến đổi", "Rơi tự do"] },
      { chapter: "Lực và Newton", topics: ["Ba định luật Newton", "Lực ma sát", "Lực hướng tâm"] },
      { chapter: "Công và năng lượng", topics: ["Công cơ học", "Động năng", "Thế năng & cơ năng"] },
    ],
    11: [
      { chapter: "Điện trường", topics: ["Điện tích & định luật Coulomb", "Điện trường", "Tụ điện"] },
      { chapter: "Dòng điện", topics: ["Dòng điện không đổi", "Nguồn điện", "Định luật Ohm"] },
      { chapter: "Từ trường", topics: ["Từ trường & cảm ứng từ", "Lực Lorentz", "Cảm ứng điện từ"] },
    ],
    12: [
      { chapter: "Dao động cơ", topics: ["Dao động điều hòa", "Con lắc lò xo", "Con lắc đơn"] },
      { chapter: "Sóng cơ", topics: ["Sóng cơ & bước sóng", "Giao thoa sóng", "Sóng dừng"] },
      { chapter: "Dòng điện xoay chiều", topics: ["Mạch RLC", "Cộng hưởng điện", "Máy biến áp"] },
    ],
  },
  Hóa: {
    10: [
      { chapter: "Cấu tạo nguyên tử", topics: ["Thành phần nguyên tử", "Số hiệu nguyên tử", "Cấu hình electron"] },
      { chapter: "Bảng tuần hoàn", topics: ["Cấu trúc bảng tuần hoàn", "Tính kim loại & phi kim", "Định luật tuần hoàn"] },
      { chapter: "Liên kết hóa học", topics: ["Liên kết ion", "Liên kết cộng hóa trị", "Hóa trị & số oxi hóa"] },
    ],
    11: [
      { chapter: "Cân bằng hóa học", topics: ["Phản ứng thuận nghịch", "Hằng số cân bằng", "Nguyên lý Le Chatelier"] },
      { chapter: "Nitrogen & Sulfur", topics: ["Nitrogen và hợp chất", "Ammonia & muối ammonium", "Sulfur và hợp chất"] },
      { chapter: "Hóa học hữu cơ", topics: ["Hydrocarbon no", "Hydrocarbon không no", "Hydrocarbon thơm"] },
    ],
    12: [
      { chapter: "Ester – Lipid", topics: ["Ester và phản ứng thủy phân", "Lipid & chất béo", "Xà phòng hóa"] },
      { chapter: "Carbohydrate", topics: ["Glucose & fructose", "Saccharose & tinh bột", "Cellulose"] },
      { chapter: "Polymer", topics: ["Khái niệm polymer", "Chất dẻo & cao su", "Tơ sợi"] },
    ],
  },
  Sinh: {
    10: [
      { chapter: "Giới thiệu sinh học", topics: ["Các cấp độ tổ chức sống", "Đặc điểm của sự sống", "Các phương pháp nghiên cứu"] },
      { chapter: "Tế bào học", topics: ["Cấu trúc tế bào", "Tế bào nhân sơ & nhân thực", "Màng tế bào"] },
      { chapter: "Quang hợp & Hô hấp", topics: ["Pha sáng quang hợp", "Chu trình Calvin", "Hô hấp tế bào"] },
    ],
    11: [
      { chapter: "Chuyển hóa vật chất", topics: ["Vận chuyển chất qua màng", "Dinh dưỡng thực vật", "Hô hấp ở thực vật"] },
      { chapter: "Cảm ứng sinh vật", topics: ["Cảm ứng ở thực vật", "Cảm ứng ở động vật", "Điện thế hoạt động"] },
      { chapter: "Sinh sản", topics: ["Sinh sản vô tính", "Sinh sản hữu tính", "Sinh sản ở thực vật"] },
    ],
    12: [
      { chapter: "Di truyền phân tử", topics: ["Cơ chế nhân đôi ADN", "Phiên mã & dịch mã", "Điều hòa biểu hiện gen"] },
      { chapter: "Di truyền nhiễm sắc thể", topics: ["Quy luật Mendel", "Di truyền liên kết", "Di truyền giới tính"] },
      { chapter: "Tiến hóa", topics: ["Bằng chứng tiến hóa", "Học thuyết tiến hóa", "Hình thành loài"] },
    ],
  },
};

const SUBJECT_COLORS: Record<string, { gradient: string; glow: string; badge: string; text: string }> = {
  Toán: { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.3)", badge: "rgba(59,130,246,0.12)", text: "#93c5fd" },
  Lý:   { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.3)", badge: "rgba(245,158,11,0.12)", text: "#fcd34d" },
  Hóa:  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.3)", badge: "rgba(16,185,129,0.12)", text: "#6ee7b7" },
  Sinh: { gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)", glow: "rgba(20,184,166,0.3)", badge: "rgba(139,92,246,0.12)", text: "#5eead4" },
};
const SUBJECT_ICONS: Record<string, string> = { Toán: "∑", Lý: "⚡", Hóa: "⬡", Sinh: "◉" };

// ─── Animated counter hook ────────────────────────────────────

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const raf = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(raf);
      else setCount(target);
    };
    requestAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function AnimatedStat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl lg:text-4xl font-black text-white mb-1 leading-none">
        {count}{suffix}
      </p>
      <p className="text-sm" style={{ color: "#64748b" }}>{label}</p>
    </div>
  );
}

// ─── Mock App Preview ─────────────────────────────────────────

function MockAppPreview() {
  return (
    <div className="relative select-none pointer-events-none" style={{ perspective: "1200px" }}>
      <div className="relative rounded-3xl overflow-hidden"
        style={{
          background: "rgba(13,17,30,0.95)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
          transform: "rotateY(-6deg) rotateX(3deg)",
          maxWidth: 340,
          margin: "0 auto",
        }}>

        {/* App bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(7,8,15,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>R</div>
            <span className="text-white font-black text-sm">Routex</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.18)", color: "#34d399" }}>AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
          </div>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Briefing card */}
          <div className="rounded-2xl p-3.5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.22)", color: "#a78bfa" }}>🌅 Daily Briefing</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>R</div>
              <div className="flex-1 rounded-xl rounded-tl-sm p-2.5" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(139,92,246,0.18)" }}>
                <p className="text-[11px] leading-relaxed" style={{ color: "#e2e8f0" }}>Hôm nay hãy tập trung <span style={{ color: "#c4b5fd" }}>Tích phân</span> nhé! Bạn đang streak <span style={{ color: "#fbbf24" }}>7 ngày</span> 🔥</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>7 ngày</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <span className="text-[10px]">📅</span>
                <span className="text-[9px] font-bold" style={{ color: "#34d399" }}>Còn 42 ngày</span>
              </div>
            </div>
          </div>

          {/* Current topic card */}
          <div className="rounded-2xl p-3.5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}>◈ Topic tuần này</span>
            <p className="text-white font-black text-sm mt-2 mb-0.5">Tích phân xác định</p>
            <p className="text-[10px] mb-2.5" style={{ color: "#c4b5fd" }}>Tuần 6 · Ứng dụng tích phân</p>
            <div className="flex flex-wrap gap-1 mb-2.5">
              {["Nguyên hàm", "∫ xác định", "Diện tích"].map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>{s}</span>
              ))}
            </div>
            <div className="w-full py-2 rounded-xl text-center text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
              Mini Test → 5 câu
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Mastery", val: "74%", color: "linear-gradient(135deg, #3b82f6, #6366f1)" },
              { label: "Score", val: "8.2", color: "linear-gradient(135deg, #10b981, #06b6d4)" },
              { label: "Topics", val: "18/24", color: "linear-gradient(135deg, #f59e0b, #f97316)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#475569" }}>{s.label}</p>
                <p className="font-black text-sm" style={{ background: s.color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav mock */}
        <div className="flex items-center justify-around px-4 py-2.5" style={{ background: "rgba(7,8,15,0.9)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[{ icon: "◉", label: "Focus" }, { icon: "◎", label: "Test" }, { icon: "◈", label: "Roadmap" }, { icon: "📋", label: "Papers" }, { icon: "○", label: "Profile" }].map((tab, i) => (
            <div key={tab.label} className="flex flex-col items-center gap-0.5">
              <span className="text-xs" style={{ color: i === 0 ? "#6366f1" : "#334155" }}>{tab.icon}</span>
              <span className="text-[8px] font-bold" style={{ color: i === 0 ? "#a78bfa" : "#1e293b" }}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl"
        style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "#fff", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}>
        🔥 7-day streak!
      </div>
      <div className="absolute -bottom-3 -left-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.5)" }}>
        ✦ AI Mascot đang học cùng bạn
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.025)", border: open ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
        <span className="font-bold text-white text-sm leading-snug">{q}</span>
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
          style={{
            background: open ? "linear-gradient(135deg, #1d4ed8, #059669)" : "rgba(255,255,255,0.06)",
            color: open ? "#fff" : "#64748b",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState("");
  const [warming, setWarming] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [previewSubject, setPreviewSubject] = useState("Toán");
  const [previewGrade, setPreviewGrade] = useState<10 | 11 | 12>(12);

  const modalRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let done = false;
    const ping = async () => {
      try {
        const start = Date.now();
        await api.ping();
        if (!done && Date.now() - start < 3000) setWarming(false);
      } catch { } finally { done = true; setWarming(false); }
    };
    timer = setTimeout(() => { if (!done) setWarming(true); }, 2000);
    ping();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showAuth) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAuth(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [showAuth]);

  const openAuth = (m: "login" | "signup") => {
    setMode(m); setError(""); setUsername(""); setPassword(""); setEmail("");
    setUsernameAvailable(null); setShowPassword(false);
    setShowAuth(true);
  };

  const getPasswordStrength = (pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
    if (pw.length === 0) return { level: 0, label: "", color: "" };
    if (pw.length < 8) return { level: 1, label: "Yếu", color: "#ef4444" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const types = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
    if (types >= 3) return { level: 3, label: "Mạnh", color: "#10b981" };
    if (types >= 2) return { level: 2, label: "Trung bình", color: "#f59e0b" };
    return { level: 1, label: "Yếu", color: "#ef4444" };
  };

  const getUsernameError = (u: string): string => {
    if (u.length === 0) return "";
    if (u.length < 3) return "Tối thiểu 3 ký tự";
    if (u.length > 30) return "Tối đa 30 ký tự";
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return "Chỉ dùng chữ, số và dấu _";
    return "";
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameAvailable(null);
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    const err = getUsernameError(val);
    if (err || val.length < 3) return;
    setUsernameChecking(true);
    usernameCheckRef.current = setTimeout(async () => {
      try {
        const res = await api.checkUsername(val);
        setUsernameAvailable(res.data.available);
      } catch { setUsernameAvailable(null); }
      finally { setUsernameChecking(false); }
    }, 500);
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true); setError("");
    try {
      const res = mode === "login"
        ? await api.login(username, password)
        : await api.signup(username, password, email || undefined);
      const { access_token, user } = res.data;
      login(user, access_token);
      try { await api.getConfig(user.id); router.push("/dashboard"); }
      catch { router.push("/onboarding/subject"); }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Có lỗi xảy ra!");
    } finally { setLoadingAuth(false); }
  };

  const pwStrength = getPasswordStrength(password);
  const usernameErr = mode === "signup" ? getUsernameError(username) : "";

  const subColor = SUBJECT_COLORS[previewSubject] || SUBJECT_COLORS["Toán"];
  const curriculum = CURRICULUM_PREVIEW[previewSubject]?.[previewGrade] || [];

  return (
    <div className="min-h-screen" style={{ background: "#070b14", color: "#f1f5f9" }}>

      {/* ── NAVBAR ────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(7,11,20,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}>
        <nav className="max-w-7xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)" }}>R</div>
            <span className="text-white font-black text-lg tracking-tight">Routex</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Tính năng", href: "#features" },
              { label: "Xem trước", href: "#preview" },
              { label: "FAQ", href: "#faq" },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="text-sm font-medium transition-colors hover:text-white cursor-pointer"
                style={{ color: "rgba(148,163,184,0.8)" }}>
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button onClick={() => openAuth("login")}
              className="hidden sm:block px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:text-white"
              style={{ color: "#94a3b8" }}>
              Đăng nhập
            </button>
            <button onClick={() => openAuth("signup")}
              className="px-4 py-2 text-sm font-bold rounded-xl text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)", boxShadow: "0 4px 18px rgba(29,78,216,0.35)" }}>
              Bắt đầu miễn phí
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO (split layout) ─────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* BG orbs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(7,11,20,1) 0%, rgba(13,17,35,0.98) 100%)" }} />
          <div className="absolute" style={{ width: 900, height: 900, top: -350, left: -200, background: "radial-gradient(circle, rgba(29,78,216,0.14), transparent 65%)", borderRadius: "50%" }} />
          <div className="absolute" style={{ width: 700, height: 700, top: -200, right: -200, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 65%)", borderRadius: "50%", animation: "float 16s ease-in-out infinite" }} />
          <div className="absolute" style={{ width: 500, height: 500, bottom: -100, left: "30%", background: "radial-gradient(circle, rgba(5,150,105,0.08), transparent 65%)", borderRadius: "50%", animation: "float 20s ease-in-out infinite", animationDelay: "8s" }} />
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to top, #070b14, transparent)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 pt-28 pb-16 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
                Dành cho học sinh THPT · Toán · Lý · Hoá · Sinh
              </div>

              <h1 className="font-black tracking-tight leading-[1.06] mb-6"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}>
                Lộ trình học THPT
                <br />
                <span style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
                  được cá nhân hoá
                </span>
                <br />
                bởi AI — cho từng em.
              </h1>

              <p className="text-base lg:text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: "#94a3b8" }}>
                Routex phân tích mục tiêu, thời gian và năng lực của bạn để tạo kế hoạch học thực tế,
                đo tiến bộ bằng bài kiểm tra thích nghi mỗi tuần.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                <button onClick={() => openAuth("signup")}
                  className="px-7 py-3.5 text-white font-bold rounded-2xl text-base transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)", boxShadow: "0 12px 40px rgba(29,78,216,0.4)" }}>
                  Bắt đầu miễn phí →
                </button>
                <button onClick={() => openAuth("login")}
                  className="px-7 py-3.5 font-semibold rounded-2xl text-base transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1" }}>
                  Đăng nhập
                </button>
              </div>

              {warming && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-amber-300 text-xs"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <span className="w-3 h-3 rounded-full border-2 border-amber-300/40 border-t-amber-300 inline-block"
                    style={{ animation: "spin 1s linear infinite" }} />
                  Máy chủ đang khởi động…
                </div>
              )}

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-6">
                {[
                  { icon: "🔒", text: "Miễn phí 100%" },
                  { icon: "🤖", text: "AI Gemini / Groq" },
                  { icon: "📚", text: "SGK Việt Nam" },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-1.5 text-xs" style={{ color: "#475569" }}>
                    <span>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mock app preview */}
            <div className="flex-1 max-w-sm w-full hidden lg:block">
              <MockAppPreview />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-30">
          <span className="text-xs" style={{ color: "#64748b" }}>Cuộn xuống</span>
          <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, #64748b, transparent)" }} />
        </div>
      </section>

      {/* ── ANIMATED STATS BAR ───────────────────────── */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x" style={{ "--tw-divide-opacity": "1" } as any}>
            <AnimatedStat value={412} suffix="+" label="Bài học trong chương trình" />
            <AnimatedStat value={4} label="Môn học: Toán · Lý · Hoá · Sinh" />
            <AnimatedStat value={3} label="Kịch bản AI: Nhẹ nhàng · Cân bằng · Bứt phá" />
            <AnimatedStat value={100} suffix="%" label="Miễn phí — không thẻ tín dụng" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#3b82f6" }}>Tính năng</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Mọi thứ bạn cần để ôn thi THPT</h2>
            <p className="max-w-xl mx-auto text-sm lg:text-base" style={{ color: "#64748b" }}>
              Routex kết hợp AI, khoa học học tập và nội dung chương trình SGK thành một nền tảng duy nhất.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animationDelay: `${i * 80}ms`,
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 lg:py-24" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8b5cf6" }}>Học sinh nói gì</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Kết quả thực tế</h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: "#64748b" }}>
              Những học sinh đã cải thiện điểm số nhờ lộ trình cá nhân hóa của Routex.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Score improvement */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{t.grade}</p>
                  </div>
                </div>
                {/* Before/After */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#64748b" }}>Trước</p>
                    <p className="text-xl font-black" style={{ color: "#f87171" }}>{t.before.toFixed(1)}</p>
                  </div>
                  <div className="flex-1 h-0.5 rounded-full mx-1" style={{ background: "linear-gradient(90deg, #ef4444, #10b981)" }} />
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#64748b" }}>Sau</p>
                    <p className="text-xl font-black" style={{ color: "#34d399" }}>{t.after.toFixed(1)}</p>
                  </div>
                  <div className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                    +{(t.after - t.before).toFixed(1)}
                  </div>
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: "#94a3b8" }}>"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE SUBJECT PREVIEW ──────────────── */}
      <section id="preview" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>Xem trước nội dung</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Chương trình học theo môn</h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: "#64748b" }}>
              Khám phá nội dung lộ trình học theo từng môn và lớp — đây là dữ liệu thực từ SGK Việt Nam.
            </p>
          </div>

          {/* Subject selector */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {Object.keys(CURRICULUM_PREVIEW).map(subj => {
              const sc = SUBJECT_COLORS[subj];
              const active = previewSubject === subj;
              return (
                <button key={subj}
                  onClick={() => setPreviewSubject(subj)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                  style={active
                    ? { background: sc.gradient, color: "#fff", boxShadow: `0 8px 24px ${sc.glow}`, transform: "scale(1.04)" }
                    : { background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>{SUBJECT_ICONS[subj]}</span>
                  {subj}
                </button>
              );
            })}
          </div>

          {/* Grade selector */}
          <div className="flex gap-2 justify-center mb-10">
            {([10, 11, 12] as const).map(g => (
              <button key={g}
                onClick={() => setPreviewGrade(g)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                style={previewGrade === g
                  ? { background: subColor.gradient, color: "#fff" }
                  : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
                Lớp {g}
              </button>
            ))}
          </div>

          {/* Curriculum preview cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {curriculum.map((chapter, i) => (
              <div key={chapter.chapter}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: subColor.gradient }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-snug">{chapter.chapter}</p>
                    <p className="text-[10px] mt-0.5 font-bold uppercase tracking-wider" style={{ color: subColor.text }}>
                      {previewSubject} · Lớp {previewGrade}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {chapter.topics.map(topic => (
                    <div key={topic} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: subColor.text }} />
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: "#64748b" }}>
              Đây chỉ là một phần nhỏ — Routex bao gồm 412+ bài học trên toàn bộ chương trình THPT.
            </p>
            <button onClick={() => openAuth("signup")}
              className="px-8 py-3.5 text-white font-bold rounded-2xl text-base transition-all active:scale-95"
              style={{ background: subColor.gradient, boxShadow: `0 12px 36px ${subColor.glow}` }}>
              Xem lộ trình đầy đủ của tôi →
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-20 lg:py-24" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Bắt đầu thế nào</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white">Chỉ 3 bước để bắt đầu</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] right-0 h-px"
                    style={{ background: "rgba(255,255,255,0.07)" }} />
                )}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg mb-4 mx-auto transition-transform duration-300 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.25), rgba(5,150,105,0.25))", border: "1px solid rgba(255,255,255,0.08)", color: "#60a5fa" }}>
                    {s.num}
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => openAuth("signup")}
              className="px-8 py-4 text-white font-bold rounded-2xl text-base transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)", boxShadow: "0 12px 40px rgba(29,78,216,0.35)" }}>
              Tạo tài khoản miễn phí →
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>FAQ</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────── */}
      <section className="py-16 lg:py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="rounded-3xl p-10 lg:p-14 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15), rgba(5,150,105,0.12))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #1d4ed8, #059669)" }} />
            <div className="absolute" style={{ width: 400, height: 400, top: -200, right: -100, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)", borderRadius: "50%" }} />
            <div className="relative z-10">
              <p className="text-3xl lg:text-4xl font-black text-white mb-3">Bắt đầu học thông minh hơn hôm nay</p>
              <p className="text-base mb-8" style={{ color: "#64748b" }}>Miễn phí, không cần thẻ tín dụng. Tạo lộ trình AI trong dưới 2 phút.</p>
              <button onClick={() => openAuth("signup")}
                className="px-10 py-4 text-white font-bold rounded-2xl text-base transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)", boxShadow: "0 16px 48px rgba(29,78,216,0.4)" }}>
                Tạo tài khoản miễn phí →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)" }}>R</div>
                <span className="text-white font-black text-lg">Routex</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                Hệ thống lộ trình học thông minh cho học sinh THPT Việt Nam. Powered by AI &amp; XGBoost.
              </p>
              <p className="text-xs mt-4" style={{ color: "#334155" }}>Một sản phẩm của Mio and Midoru</p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>Môn học</p>
                <div className="space-y-2.5">
                  {["Toán học", "Vật lý", "Hóa học", "Sinh học"].map(s => (
                    <button key={s} onClick={() => openAuth("signup")} className="block text-sm transition-colors hover:text-white" style={{ color: "#475569" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>Tính năng</p>
                <div className="space-y-2.5">
                  {["Lộ trình AI", "Gia sư AI", "Thi thử THPT", "Ôn tập SM-2"].map(f => (
                    <button key={f} onClick={() => openAuth("signup")} className="block text-sm transition-colors hover:text-white" style={{ color: "#475569" }}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>Tài khoản</p>
                <div className="space-y-2.5">
                  <button onClick={() => openAuth("signup")} className="block text-sm transition-colors hover:text-white" style={{ color: "#475569" }}>Đăng ký miễn phí</button>
                  <button onClick={() => openAuth("login")} className="block text-sm transition-colors hover:text-white" style={{ color: "#475569" }}>Đăng nhập</button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <p className="text-xs" style={{ color: "#334155" }}>
              © {new Date().getFullYear()} Routex · Mio and Midoru · Dành cho học sinh THPT Việt Nam
            </p>
            <div className="flex items-center gap-4">
              {[
                { label: "GitHub", icon: "⌥" },
                { label: "Zalo", icon: "💬" },
                { label: "Facebook", icon: "◎" },
              ].map(s => (
                <button key={s.label} className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: "#475569" }}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── AUTH MODAL ───────────────────────────────── */}
      {showAuth && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div ref={modalRef}
            className="w-full max-w-sm rounded-3xl relative overflow-y-auto"
            style={{
              background: "#0d1420",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
              animation: "modalIn 0.22s ease",
              maxHeight: "92vh",
            }}>

            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
              style={{ background: "linear-gradient(90deg, #1d4ed8, #059669)" }} />

            <div className="p-7">
              <button onClick={() => setShowAuth(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg"
                style={{ color: "#64748b", background: "rgba(255,255,255,0.05)" }}>×</button>

              {/* Header */}
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white mb-4"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)" }}>R</div>
                <h2 className="text-xl font-black text-white">
                  {mode === "login" ? "Chào mừng trở lại" : "Bắt đầu hành trình"}
                </h2>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                  {mode === "login" ? "Đăng nhập vào Routex để tiếp tục." : "Tạo tài khoản miễn phí, không cần thẻ tín dụng."}
                </p>
              </div>

              {/* Mode tabs */}
              <div className="flex rounded-xl p-1 mb-5 gap-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {(["login", "signup"] as const).map((m) => (
                  <button key={m}
                    onClick={() => { setMode(m); setError(""); setUsernameAvailable(null); }}
                    className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200"
                    style={mode === m
                      ? { background: "linear-gradient(135deg, #1d4ed8, #059669)", color: "#fff", boxShadow: "0 4px 14px rgba(29,78,216,0.35)" }
                      : { color: "#64748b", background: "transparent" }}>
                    {m === "login" ? "Đăng nhập" : "Đăng ký"}
                  </button>
                ))}
              </div>

              {/* OAuth buttons */}
              <div className="space-y-2.5 mb-5">
                <a href="/api/auth/google"
                  className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {mode === "login" ? "Đăng nhập" : "Đăng ký"} với Google
                </a>
                <a href="/api/auth/facebook"
                  className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(24,119,242,0.12)", border: "1px solid rgba(24,119,242,0.25)", color: "#e2e8f0" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  {mode === "login" ? "Đăng nhập" : "Đăng ký"} với Facebook
                </a>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <span className="text-[11px] font-medium" style={{ color: "#334155" }}>hoặc dùng tài khoản</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handle} className="space-y-4">

                {/* Username field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                    {mode === "login" ? "Tên đăng nhập hoặc Email" : "Tên đăng nhập"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={e => mode === "signup" ? handleUsernameChange(e.target.value) : setUsername(e.target.value)}
                      required
                      placeholder={mode === "login" ? "vd: nguyenvana hoặc email@gmail.com" : "vd: nguyenvana"}
                      autoComplete="username"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all pr-10"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: mode === "signup" && username.length >= 3
                          ? usernameErr
                            ? "1px solid rgba(239,68,68,0.5)"
                            : usernameAvailable === true
                              ? "1px solid rgba(16,185,129,0.5)"
                              : usernameAvailable === false
                                ? "1px solid rgba(239,68,68,0.5)"
                                : "1px solid rgba(255,255,255,0.09)"
                          : "1px solid rgba(255,255,255,0.09)"
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                      onBlur={e => {
                        e.target.style.background = "rgba(255,255,255,0.05)";
                        if (mode !== "signup" || username.length < 3) e.target.style.borderColor = "rgba(255,255,255,0.09)";
                      }} />
                    {/* Status icon */}
                    {mode === "signup" && username.length >= 3 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        {usernameChecking
                          ? <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full inline-block" style={{ animation: "spin 0.8s linear infinite" }} />
                          : usernameErr
                            ? <span style={{ color: "#ef4444" }}>✗</span>
                            : usernameAvailable === true
                              ? <span style={{ color: "#10b981" }}>✓</span>
                              : usernameAvailable === false
                                ? <span style={{ color: "#ef4444" }}>✗</span>
                                : null}
                      </span>
                    )}
                  </div>
                  {/* Username hints */}
                  {mode === "signup" && username.length > 0 && (
                    <p className="text-[11px] mt-1.5 ml-1" style={{
                      color: usernameErr
                        ? "#ef4444"
                        : usernameAvailable === false
                          ? "#ef4444"
                          : usernameAvailable === true
                            ? "#10b981"
                            : "#64748b"
                    }}>
                      {usernameErr
                        ? usernameErr
                        : usernameAvailable === false
                          ? "Tên đăng nhập đã tồn tại"
                          : usernameAvailable === true
                            ? "Tên đăng nhập khả dụng ✓"
                            : `${username.length}/30 ký tự · chỉ dùng chữ, số, _`}
                    </p>
                  )}
                </div>

                {/* Email field (signup only) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                      Email <span style={{ color: "#334155", textTransform: "none", letterSpacing: 0 }}>(không bắt buộc)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="vd: email@gmail.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
                  </div>
                )}

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Mật khẩu</label>
                    {mode === "signup" && pwStrength.level > 0 && (
                      <span className="text-[11px] font-bold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder={mode === "signup" ? "Tối thiểu 8 ký tự" : "Mật khẩu của bạn"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all pr-11"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-colors"
                      style={{ color: showPassword ? "#60a5fa" : "#475569" }}
                      tabIndex={-1}>
                      {showPassword ? "◉" : "○"}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {mode === "signup" && password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= pwStrength.level ? pwStrength.color : "rgba(255,255,255,0.08)" }} />
                      ))}
                    </div>
                  )}
                  {mode === "signup" && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                      {[
                        { ok: password.length >= 8, label: "8+ ký tự" },
                        { ok: /[A-Z]/.test(password), label: "Chữ hoa" },
                        { ok: /[0-9]/.test(password), label: "Số" },
                        { ok: /[^A-Za-z0-9]/.test(password), label: "Ký tự đặc biệt" },
                      ].map(({ ok, label }) => (
                        <span key={label} className="text-[10px]" style={{ color: ok ? "#10b981" : "#334155" }}>
                          {ok ? "✓" : "·"} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    <span className="flex-shrink-0 mt-0.5">⚠</span> {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loadingAuth}
                  className="w-full py-3.5 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #059669)", boxShadow: "0 8px 28px rgba(29,78,216,0.35)" }}>
                  {loadingAuth
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: "spin 1s linear infinite" }} />
                        Đang xử lý…
                      </span>
                    : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                </button>
              </form>

              <p className="text-center text-[11px] mt-5" style={{ color: "#334155" }}>
                Khi tiếp tục, bạn đồng ý với điều khoản sử dụng của Routex.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
