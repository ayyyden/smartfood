"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "smartfood_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

const DARK_VARS: Record<string, string> = {
  "--sf-bg-deep": "#050505",
  "--sf-bg":      "#0a0a0a",
  "--sf-surface":  "#141414",
  "--sf-surface2": "#111111",
  "--sf-surface3": "#0d0d0d",
  "--sf-input":    "#1c1c1c",
  "--sf-pill":     "#1e1e1e",
  "--sf-border":   "#1a1a1a",
  "--sf-border2":  "#252525",
  "--sf-text1": "#ffffff",
  "--sf-text2": "#cccccc",
  "--sf-text3": "#888888",
  "--sf-text4": "#666666",
  "--sf-text5": "#555555",
  "--sf-text6": "#444444",
  "--sf-text7": "#333333",
  "--sf-text8": "#2a2a2a",
  "--sf-shadow":  "rgba(0,0,0,0.5)",
  "--sf-overlay": "rgba(0,0,0,0.75)",
};

const LIGHT_VARS: Record<string, string> = {
  "--sf-bg-deep": "#e0e0e3",
  "--sf-bg":      "#f0f0f2",
  "--sf-surface":  "#ffffff",
  "--sf-surface2": "#f4f4f6",
  "--sf-surface3": "#f8f8fa",
  "--sf-input":    "#ebebed",
  "--sf-pill":     "#e5e5e8",
  "--sf-border":   "#e0e0e3",
  "--sf-border2":  "#d0d0d4",
  "--sf-text1": "#0a0a0a",
  "--sf-text2": "#2a2a2a",
  "--sf-text3": "#606060",
  "--sf-text4": "#808080",
  "--sf-text5": "#909090",
  "--sf-text6": "#a0a0a0",
  "--sf-text7": "#b8b8b8",
  "--sf-text8": "#cacaca",
  "--sf-shadow":  "rgba(0,0,0,0.08)",
  "--sf-overlay": "rgba(0,0,0,0.5)",
};

// Injects all CSS variables as inline styles on <html>.
// Inline styles are highest-priority CSS — nothing can override them.
export function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.setAttribute("data-theme", t);
  const vars = t === "dark" ? DARK_VARS : LIGHT_VARS;
  for (const [k, v] of Object.entries(vars)) {
    el.style.setProperty(k, v);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const t: Theme = saved === "light" ? "light" : "dark";
    setThemeState(t);
    applyTheme(t);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
