"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";

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

// ── Slide definitions (keys reference translation JSON) ───────────────────────

const SLIDE_DEFS = [
  { key: "smart",    icon: <IconSmart />,    accentColor: "#00d2ff", accentBg: "rgba(0,210,255,0.1)",    accentBorder: "rgba(0,210,255,0.2)" },
  { key: "pro",      icon: <IconPro />,      accentColor: "#fb923c", accentBg: "rgba(251,146,60,0.1)",   accentBorder: "rgba(251,146,60,0.2)" },
  { key: "log",      icon: <IconLog />,      accentColor: "#a78bfa", accentBg: "rgba(167,139,250,0.1)",  accentBorder: "rgba(167,139,250,0.2)" },
  { key: "menu",     icon: <IconMenu />,     accentColor: "#4ade80", accentBg: "rgba(74,222,128,0.1)",   accentBorder: "rgba(74,222,128,0.2)" },
  { key: "progress", icon: <IconProgress />, accentColor: "#38bdf8", accentBg: "rgba(56,189,248,0.1)",   accentBorder: "rgba(56,189,248,0.2)" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const { t, dir } = useLang();
  const [index, setIndex] = useState(0);
  const slide = SLIDE_DEFS[index];
  const isLast = index === SLIDE_DEFS.length - 1;

  // In RTL the back/next chevrons flip direction
  const prevPoints = dir === "rtl" ? "9 18 15 12 9 6" : "15 18 9 12 15 6";
  const nextPoints = dir === "rtl" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.88)", zIndex: 100 }}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl px-6 pt-8 pb-10"
        style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)", borderBottom: "none" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text5)" }}>
            {t("tutorial.label")}
          </span>
          <button
            onClick={onDone}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{ color: "var(--sf-text3)", backgroundColor: "var(--sf-input)" }}
          >
            {t("tutorial.skip")}
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
          <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
            {t(`tutorial.${slide.key}Title`)}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--sf-text3)" }}>
            {t(`tutorial.${slide.key}Body`)}
          </p>
        </div>

        {/* Dots + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SLIDE_DEFS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:           i === index ? 20 : 6,
                  height:          6,
                  backgroundColor: i === index ? slide.accentColor : "var(--sf-border2)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
                style={{ backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={prevPoints} />
                </svg>
              </button>
            )}
            <button
              onClick={isLast ? onDone : () => setIndex((i) => i + 1)}
              className="rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95"
              style={{ backgroundColor: slide.accentColor, color: "#0a0a0a" }}
            >
              {isLast ? t("tutorial.finish") : t("tutorial.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
