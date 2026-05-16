"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

type TrackingMode = "smart" | "pro";
const MODE_KEY = "smartfood_mode";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
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
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-[17px] font-black tracking-tight" style={{ color: "var(--sf-text1)" }}>
          Settings
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
              Account
            </p>
            <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>{user.email}</p>
            <button
              onClick={async () => { await signOut(); router.push("/auth"); }}
              className="w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.18)" }}
            >
              Log out
            </button>
          </div>
        )}

        {/* Tracking Mode */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--sf-text6)" }}
          >
            Tracking Mode
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {mode === "smart"
              ? "AI-powered — describe meals in plain text, the AI logs the macros"
              : "Manual precision — search foods, set exact portions, build meals"}
          </p>

          <div
            className="flex overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--sf-border2)" }}
          >
            <button
              onClick={() => switchMode("smart")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: mode === "smart" ? "rgba(0,210,255,0.1)" : "transparent",
                borderRight: "1px solid var(--sf-border2)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: mode === "smart" ? "#00d2ff" : "var(--sf-text5)" }}
              >
                Smart
              </span>
              <span
                className="text-[10px]"
                style={{ color: mode === "smart" ? "rgba(0,210,255,0.55)" : "var(--sf-text7)" }}
              >
                AI-powered chat
              </span>
            </button>
            <button
              onClick={() => switchMode("pro")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: mode === "pro" ? "rgba(251,146,60,0.1)" : "transparent",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: mode === "pro" ? "#fb923c" : "var(--sf-text5)" }}
              >
                Pro
              </span>
              <span
                className="text-[10px]"
                style={{ color: mode === "pro" ? "rgba(251,146,60,0.55)" : "var(--sf-text7)" }}
              >
                Manual precision
              </span>
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--sf-text6)" }}
          >
            Appearance
          </p>
          <p className="mb-4 text-xs" style={{ color: "var(--sf-text5)" }}>
            {isDark ? "Easy on the eyes in low light" : "Clear and bright in daylight"}
          </p>

          <div
            className="flex overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--sf-border2)" }}
          >
            <button
              onClick={() => setTheme("dark")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: isDark ? "rgba(129,140,248,0.1)" : "transparent",
                borderRight: "1px solid var(--sf-border2)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: isDark ? "#818cf8" : "var(--sf-text5)" }}
              >
                Dark
              </span>
              <span
                className="text-[10px]"
                style={{ color: isDark ? "rgba(129,140,248,0.55)" : "var(--sf-text7)" }}
              >
                Saves battery
              </span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className="flex flex-1 flex-col items-center gap-0.5 py-3.5 transition-colors"
              style={{
                backgroundColor: !isDark ? "rgba(251,191,36,0.1)" : "transparent",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: !isDark ? "#fbbf24" : "var(--sf-text5)" }}
              >
                Light
              </span>
              <span
                className="text-[10px]"
                style={{ color: !isDark ? "rgba(251,191,36,0.55)" : "var(--sf-text7)" }}
              >
                Easier to read
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
