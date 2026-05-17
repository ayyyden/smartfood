"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import enMessages from "@/messages/en.json";
import heMessages from "@/messages/he.json";

export type Lang = "en" | "he";
const STORAGE_KEY = "smartfood_lang";

type Messages = Record<string, unknown>;
const MESSAGES: Record<Lang, Messages> = {
  en: enMessages as Messages,
  he: heMessages as Messages,
};

interface LangContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (key) => key,
});

// Traverse nested object via dot-notation path.
function resolve(obj: Messages, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return path;
    cur = (cur as Messages)[p];
  }
  return typeof cur === "string" ? cur : path;
}

export function applyLang(l: Lang) {
  const el = document.documentElement;
  el.setAttribute("lang", l);
  el.setAttribute("dir", l === "he" ? "rtl" : "ltr");
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const l: Lang = saved === "he" ? "he" : "en";
    setLangState(l);
    applyLang(l);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    applyLang(l);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let str = resolve(MESSAGES[lang], key);
    // Fall back to English if key is missing in the active language
    if (str === key && lang !== "en") {
      str = resolve(MESSAGES.en, key);
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{{${k}}}`, String(v));
      }
    }
    return str;
  }

  return (
    <LangContext.Provider
      value={{ lang, dir: lang === "he" ? "rtl" : "ltr", setLang, t }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
