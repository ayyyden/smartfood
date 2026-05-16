"use client";

import { useState } from "react";

// ── Slide icons ───────────────────────────────────────────────────────────────

function IconSmart() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2c-2.5-1.5-4-4-4-7a8 8 0 0 1 8-8z" />
      <line x1="9" y1="21" x2="15" y2="21" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="9.5" y1="10.5" x2="12" y2="13" />
    </svg>
  );
}

function IconPro() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function IconLog() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconProgress() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: <IconSmart />,
    accentColor: "#00d2ff",
    accentBg: "rgba(0,210,255,0.1)",
    accentBorder: "rgba(0,210,255,0.2)",
    title: "Smart Mode",
    body: "Type what you ate naturally and Smartfood instantly logs your calories and macros using AI. No searching, no fuss.",
  },
  {
    icon: <IconPro />,
    accentColor: "#fb923c",
    accentBg: "rgba(251,146,60,0.1)",
    accentBorder: "rgba(251,146,60,0.2)",
    title: "Pro Mode",
    body: "Switch to Pro for exact tracking. Build meals from 36 built-in foods or create and save your own custom foods.",
  },
  {
    icon: <IconLog />,
    accentColor: "#a78bfa",
    accentBg: "rgba(167,139,250,0.1)",
    accentBorder: "rgba(167,139,250,0.2)",
    title: "Food Log",
    body: "Every meal is saved in your Food Log. Tap any entry to see the full breakdown, edit the numbers, or delete it.",
  },
  {
    icon: <IconMenu />,
    accentColor: "#4ade80",
    accentBg: "rgba(74,222,128,0.1)",
    accentBorder: "rgba(74,222,128,0.2)",
    title: "Mix & Match Menu",
    body: "The Menu tab shows what you can still eat today to hit your calorie and macro goals. Great for planning ahead.",
  },
  {
    icon: <IconProgress />,
    accentColor: "#38bdf8",
    accentBg: "rgba(56,189,248,0.1)",
    accentBorder: "rgba(56,189,248,0.2)",
    title: "Progress",
    body: "Log your weight each day to track changes over time. See trends and stay motivated on your journey.",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.88)", zIndex: 100 }}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl px-6 pt-8 pb-10"
        style={{ backgroundColor: "#0f0f0f", border: "1px solid #252525", borderBottom: "none" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#444444" }}>
            Quick tutorial
          </span>
          <button
            onClick={onDone}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{ color: "#555555", backgroundColor: "#1c1c1c" }}
          >
            Skip
          </button>
        </div>

        {/* Icon */}
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: slide.accentBg, border: `1px solid ${slide.accentBorder}` }}
        >
          {slide.icon}
        </div>

        {/* Content */}
        <div className="mb-8 space-y-2">
          <p className="text-[22px] font-black leading-tight" style={{ color: "#ffffff" }}>
            {slide.title}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#888888" }}>
            {slide.body}
          </p>
        </div>

        {/* Dots + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:           i === index ? 20 : 6,
                  height:          6,
                  backgroundColor: i === index ? slide.accentColor : "#333333",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
                style={{ backgroundColor: "#1c1c1c", color: "#666666" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <button
              onClick={isLast ? onDone : () => setIndex((i) => i + 1)}
              className="rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95"
              style={{ backgroundColor: slide.accentColor, color: "#0a0a0a" }}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
