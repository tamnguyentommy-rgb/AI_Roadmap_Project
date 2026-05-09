"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/contexts/auth";
import api from "../../../src/lib/api";

const SUBJECT_META: Record<string, { gradient: string; glow: string; orb: string; border: string }> = {
  Toán: { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.35)", orb: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.4)" },
  Lý:   { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.35)", orb: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)" },
  Hóa:  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.35)", orb: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)" },
  Sinh: { gradient: "linear-gradient(135deg, #14b8a6, #8b5cf6)", glow: "rgba(20,184,166,0.35)", orb: "rgba(139,92,246,0.12)", border: "rgba(20,184,166,0.4)" },
};

interface Chapter {
  chapter: string;
  lessons: string[];
}

export default function TopicsPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();

  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState(12);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !user) { router.push("/"); return; }
    const subj = sessionStorage.getItem("subject") || "Toán";
    const gr = parseInt(sessionStorage.getItem("grade") || "12");
    setSubject(subj);
    setGrade(gr);
    const t = setTimeout(() => setVisible(true), 60);

    api.getCurriculumTopics(subj, gr).then(res => {
      const chs: Chapter[] = res.data.chapters;
      setChapters(chs);
      const allLessons = new Set<string>(chs.flatMap(c => c.lessons));
      setSelected(allLessons);
      setExpanded(new Set(chs.map(c => c.chapter)));
      setLoading(false);
    }).catch(() => {
      setError("Không thể tải danh sách chủ đề. Vui lòng thử lại.");
      setLoading(false);
    });

    return () => clearTimeout(t);
  }, [isLoaded, user]);

  const meta = SUBJECT_META[subject] || SUBJECT_META["Toán"];

  const allLessons = chapters.flatMap(c => c.lessons);
  const allSelected = allLessons.length > 0 && allLessons.every(l => selected.has(l));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allLessons));
    }
  };

  const toggleChapter = (chapter: Chapter) => {
    const allIn = chapter.lessons.every(l => selected.has(l));
    const next = new Set(selected);
    if (allIn) {
      chapter.lessons.forEach(l => next.delete(l));
    } else {
      chapter.lessons.forEach(l => next.add(l));
    }
    setSelected(next);
  };

  const toggleLesson = (lesson: string) => {
    const next = new Set(selected);
    if (next.has(lesson)) {
      next.delete(lesson);
    } else {
      next.add(lesson);
    }
    setSelected(next);
  };

  const toggleExpand = (chapter: string) => {
    const next = new Set(expanded);
    if (next.has(chapter)) {
      next.delete(chapter);
    } else {
      next.add(chapter);
    }
    setExpanded(next);
  };

  const chapterState = (chapter: Chapter): "all" | "some" | "none" => {
    const count = chapter.lessons.filter(l => selected.has(l)).length;
    if (count === 0) return "none";
    if (count === chapter.lessons.length) return "all";
    return "some";
  };

  const handleContinue = async () => {
    if (!user) return;
    if (selected.size === 0) {
      setError("Vui lòng chọn ít nhất một chủ đề!");
      return;
    }
    setSaving(true);
    setError("");
    const topics = Array.from(selected);
    try {
      sessionStorage.setItem("selectedTopics", JSON.stringify(topics));
      const mode = sessionStorage.getItem("mode") || "exam";
      const gradeNum = parseInt(sessionStorage.getItem("grade") || "12");
      await api.saveConfig(user.id, {
        subject,
        grade: gradeNum,
        mode,
        target_score: 8.0,
        daily_study_time: 60,
        selected_topics: topics,
      });
      router.push("/test");
    } catch {
      setError("Không thể lưu chủ đề. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden"
      style={{ background: "#07080f" }}
    >
      <div className="aurora-orb" style={{ width: 480, height: 480, top: -200, right: -160, background: `radial-gradient(circle, ${meta.orb}, transparent 70%)` }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 360, height: 360, bottom: -120, left: -120, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)" }} />
      <div className="absolute top-0 left-0 right-0 h-px opacity-80 pointer-events-none" style={{ background: meta.gradient }} />

      <div className="relative z-10 w-full max-w-2xl">

        {/* Header */}
        <div
          className="text-center mb-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.55s cubic-bezier(0.4,0,0.2,1)" }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a78bfa" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Bước 4 / 4 &nbsp;·&nbsp; Chọn chủ đề ôn thi
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            Bạn muốn ôn<br />
            <span style={{ background: meta.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              những chủ đề nào?
            </span>
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Đề kiểm tra đầu vào và lộ trình học sẽ chỉ tập trung vào các chủ đề bạn chọn
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent" style={{ borderColor: meta.border, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
            <p className="text-sm" style={{ color: "#64748b" }}>Đang tải danh sách chủ đề...</p>
          </div>
        ) : (
          <div style={{ opacity: visible ? 1 : 0, transition: "all 0.55s ease 0.1s" }}>

            {/* Select all bar */}
            <div
              className="glass-premium rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer"
              onClick={toggleAll}
              style={{ border: allSelected ? `1px solid ${meta.border}` : "1px solid rgba(255,255,255,0.09)", transition: "border-color 0.2s" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={allSelected
                    ? { background: meta.gradient, boxShadow: `0 4px 16px ${meta.glow}` }
                    : { border: "2px solid rgba(255,255,255,0.18)", background: "transparent" }}
                >
                  {allSelected && <span className="text-white text-xs font-black">✓</span>}
                  {!allSelected && someSelected && <span className="text-white text-xs font-black">–</span>}
                </div>
                <span className="text-white font-black text-sm">Chọn tất cả</span>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${meta.orb}`, color: "#a5b4fc", border: `1px solid ${meta.border.replace("0.4", "0.2")}` }}>
                {selected.size} / {allLessons.length} chủ đề
              </span>
            </div>

            {/* Chapter list */}
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {chapters.map((ch, i) => {
                const state = chapterState(ch);
                const isExpanded = expanded.has(ch.chapter);

                return (
                  <div
                    key={i}
                    className="glass-premium rounded-2xl overflow-hidden"
                    style={{ border: state === "none" ? "1px solid rgba(255,255,255,0.07)" : `1px solid ${meta.border}`, transition: "border-color 0.2s" }}
                  >
                    {/* Chapter row */}
                    <div className="flex items-center gap-3 p-4 cursor-pointer" style={{ background: state !== "none" ? `${meta.orb}` : "transparent" }}>
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer"
                        onClick={e => { e.stopPropagation(); toggleChapter(ch); }}
                        style={state === "all"
                          ? { background: meta.gradient, boxShadow: `0 4px 16px ${meta.glow}` }
                          : state === "some"
                          ? { background: "rgba(99,102,241,0.3)", border: `1px solid ${meta.border}` }
                          : { border: "2px solid rgba(255,255,255,0.18)", background: "transparent" }}
                      >
                        {state === "all" && <span className="text-white text-xs font-black">✓</span>}
                        {state === "some" && <span className="text-white text-xs font-black">–</span>}
                      </div>

                      <div className="flex-1 min-w-0" onClick={() => toggleExpand(ch.chapter)}>
                        <p className="text-white font-bold text-sm leading-snug truncate">{ch.chapter}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                          {ch.lessons.filter(l => selected.has(l)).length} / {ch.lessons.length} bài
                        </p>
                      </div>

                      <button
                        onClick={() => toggleExpand(ch.chapter)}
                        className="text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-all duration-200"
                        style={{ color: "#64748b", transform: isExpanded ? "rotate(180deg)" : "none" }}
                      >
                        ▾
                      </button>
                    </div>

                    {/* Lessons */}
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {ch.lessons.map((lesson, j) => {
                          const isOn = selected.has(lesson);
                          return (
                            <button
                              key={j}
                              onClick={() => toggleLesson(lesson)}
                              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all duration-150"
                              style={isOn
                                ? { background: `${meta.orb}`, border: `1px solid ${meta.border.replace("0.4", "0.2")}` }
                                : { background: "transparent", border: "1px solid transparent" }}
                            >
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                                style={isOn
                                  ? { background: meta.gradient, boxShadow: `0 3px 10px ${meta.glow}` }
                                  : { border: "1.5px solid rgba(255,255,255,0.15)", background: "transparent" }}
                              >
                                {isOn && <span className="text-white font-black" style={{ fontSize: 9 }}>✓</span>}
                              </div>
                              <span className="text-sm leading-snug" style={{ color: isOn ? "#e2e8f0" : "#94a3b8" }}>{lesson}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 text-sm mt-4"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
                ⚠ {error}
              </div>
            )}

            {/* Continue */}
            <button
              onClick={handleContinue}
              disabled={saving || selected.size === 0}
              className="btn-glow w-full py-4 font-black text-white rounded-2xl text-base mt-5 disabled:opacity-40"
              style={{
                background: selected.size > 0 ? meta.gradient : "rgba(255,255,255,0.08)",
                boxShadow: selected.size > 0 ? `0 12px 44px ${meta.glow}` : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              {saving
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: "spin 1s linear infinite" }} />
                    Đang lưu...
                  </span>
                : `Làm bài kiểm tra với ${selected.size} chủ đề →`}
            </button>

            {/* Step dots */}
            <div className="flex justify-center gap-2.5 mt-7">
              <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
              <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
              <span className="h-1.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
              <span className="h-1.5 w-12 rounded-full" style={{ background: meta.gradient, boxShadow: `0 0 8px ${meta.glow}` }} />
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
