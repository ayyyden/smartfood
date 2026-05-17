"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";

const STORAGE_KEY = "smartfood_update_language_v1_seen";

export default function UpdateNote() {
  const { t, dir } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ backgroundColor: "var(--sf-overlay)" }}
      onClick={dismiss}
    >
      <div
        dir={dir}
        className="relative w-full max-w-[430px] rounded-t-3xl px-6 pb-10 pt-5 shadow-2xl"
        style={{ backgroundColor: "var(--sf-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pb-4">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--sf-border2)" }} />
        </div>

        {/* icon */}
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
          style={{ backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" }}
        >
          🌐
        </div>

        <p className="text-lg font-black leading-snug" style={{ color: "var(--sf-text1)" }}>
          {t("updateNote.title")}
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--sf-text5)" }}>
          {t("updateNote.message")}
        </p>

        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-2xl py-4 text-sm font-bold transition-all active:scale-95"
          style={{ backgroundColor: "#00d2ff", color: "#000" }}
        >
          {t("updateNote.button")}
        </button>
      </div>
    </div>
  );
}
