"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";

type TrackingMode = "smart" | "pro";
const MODE_KEY = "smartfood_mode";
const TUTORIAL_REOPEN_KEY = "smartfood_tutorial_reopen";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { lang, setLang, t, dir } = useLang();
  const isDark = theme === "dark";
  const [mode, setMode] = useState<TrackingMode>("smart");

  useEffect(() => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "smart" || saved === "pro") setMode(saved as TrackingMode);
  }, []);

  function switchMode(m: TrackingMode) {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
  }

  // Back arrow flips in RTL
  const backArrow = dir === "rtl" ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6";

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "var(--sf-bg)" }}
    >
      {/* Header */}
      <div
        className="flex h-14 shrink-0 items-center gap-3 px-4"
        style={{ backgroundColor: "var(--sf-bg)", borderBottom: "1px solid var(--sf-border)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95"
          style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text4)" }}
          aria-label={t("settings.back")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={backArrow} />
          </svg>
        </button>
        <p className="text-[17px] font-black tracking-tight" style={{ color: "var(--sf-text1)" }}>
          {t("settings.title")}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* Account */}
        {user && (
          <div
            className="rounded-2xl px-5 py-5"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
          >
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
              {t("settings.account")}
            </p>
            <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>{user.email}</p>
            <button
              onClick={async () => { await signOut(); router.push("/auth"); }}
              className="w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.18)" }}
            >
              {t("settings.logOut")}
            </button>
          </div>
        )}

        {/* Tracking Mode */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            {t("settings.trackingMode")}
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {mode === "smart" ? t("settings.smartDesc") : t("settings.proDesc")}
          </p>

          <div className="flex overflow-hidden rounded-xl" style={{ border: "1px solid var(--sf-border2)" }}>
            <button
              onClick={() => switchMode("smart")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: mode === "smart" ? "rgba(0,210,255,0.1)" : "transparent",
                borderRight: "1px solid var(--sf-border2)",
              }}
            >
              <span className="text-sm font-bold" style={{ color: mode === "smart" ? "#00d2ff" : "var(--sf-text5)" }}>
                {t("settings.smart")}
              </span>
              <span className="text-[10px]" style={{ color: mode === "smart" ? "rgba(0,210,255,0.55)" : "var(--sf-text7)" }}>
                {t("settings.smartSub")}
              </span>
            </button>
            <button
              onClick={() => switchMode("pro")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{ backgroundColor: mode === "pro" ? "rgba(251,146,60,0.1)" : "transparent" }}
            >
              <span className="text-sm font-bold" style={{ color: mode === "pro" ? "#fb923c" : "var(--sf-text5)" }}>
                {t("settings.pro")}
              </span>
              <span className="text-[10px]" style={{ color: mode === "pro" ? "rgba(251,146,60,0.55)" : "var(--sf-text7)" }}>
                {t("settings.proSub")}
              </span>
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            {t("settings.help")}
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {t("settings.helpDesc")}
          </p>
          <button
            onClick={() => { localStorage.setItem(TUTORIAL_REOPEN_KEY, "1"); router.push("/"); }}
            className="w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "rgba(0,210,255,0.08)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.18)" }}
          >
            {t("settings.showTutorial")}
          </button>
        </div>

        {/* Appearance */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            {t("settings.appearance")}
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {isDark ? t("settings.darkDesc") : t("settings.lightDesc")}
          </p>

          <div className="flex overflow-hidden rounded-xl" style={{ border: "1px solid var(--sf-border2)" }}>
            <button
              onClick={() => setTheme("dark")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: isDark ? "rgba(129,140,248,0.1)" : "transparent",
                borderRight: "1px solid var(--sf-border2)",
              }}
            >
              <span className="text-sm font-bold" style={{ color: isDark ? "#818cf8" : "var(--sf-text5)" }}>
                {t("settings.dark")}
              </span>
              <span className="text-[10px]" style={{ color: isDark ? "rgba(129,140,248,0.55)" : "var(--sf-text7)" }}>
                {t("settings.darkSub")}
              </span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{ backgroundColor: !isDark ? "rgba(251,191,36,0.1)" : "transparent" }}
            >
              <span className="text-sm font-bold" style={{ color: !isDark ? "#fbbf24" : "var(--sf-text5)" }}>
                {t("settings.light")}
              </span>
              <span className="text-[10px]" style={{ color: !isDark ? "rgba(251,191,36,0.55)" : "var(--sf-text7)" }}>
                {t("settings.lightSub")}
              </span>
            </button>
          </div>
        </div>

        {/* Language */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            {t("settings.language")}
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {t("settings.languageDesc")}
          </p>

          <div className="flex overflow-hidden rounded-xl" style={{ border: "1px solid var(--sf-border2)" }}>
            <button
              onClick={() => setLang("en")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: lang === "en" ? "rgba(0,210,255,0.1)" : "transparent",
                borderRight: "1px solid var(--sf-border2)",
              }}
            >
              <span className="text-sm font-bold" style={{ color: lang === "en" ? "#00d2ff" : "var(--sf-text5)" }}>
                English
              </span>
              <span className="text-[10px]" style={{ color: lang === "en" ? "rgba(0,210,255,0.55)" : "var(--sf-text7)" }}>
                LTR
              </span>
            </button>
            <button
              onClick={() => setLang("he")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{ backgroundColor: lang === "he" ? "rgba(0,210,255,0.1)" : "transparent" }}
            >
              <span className="text-sm font-bold" style={{ color: lang === "he" ? "#00d2ff" : "var(--sf-text5)" }}>
                עברית
              </span>
              <span className="text-[10px]" style={{ color: lang === "he" ? "rgba(0,210,255,0.55)" : "var(--sf-text7)" }}>
                RTL
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
