"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DumbbellLogo from "@/components/DumbbellLogo";
import { isOnboardingComplete } from "@/lib/db/profiles";

type Mode = "login" | "signup";

// Inlined at build time — tells us what Vercel actually baked in
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Show debug panel on local dev or Vercel preview, never on production
const SHOW_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

function getUrlHost(url: string): string {
  if (!url) return "(not set)";
  try { return new URL(url).hostname; } catch { return "(invalid URL format)"; }
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof e.message === "string" && e.message) parts.push(e.message);
    if (typeof e.code    === "string" && e.code)    parts.push(`code: ${e.code}`);
    if (typeof e.details === "string" && e.details) parts.push(`details: ${e.details}`);
    if (typeof e.hint    === "string" && e.hint)    parts.push(`hint: ${e.hint}`);
    return parts.join(" — ") || JSON.stringify(err);
  }
  return String(err);
}

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("networkerror") || m.includes("failed to fetch") || m.includes("load failed") || m.includes("fetch")) {
    return (
      "Cannot reach Supabase — network request failed. " +
      "Likely causes: Supabase project is paused (resume it at supabase.com/dashboard), " +
      "or env vars were added to Vercel but the app wasn't redeployed after."
    );
  }
  return msg;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
          console.error("[Auth] signUp error code:", authError.code);
          console.error("[Auth] signUp error message:", authError.message);
          console.error("[Auth] signUp error status:", authError.status);
          setError(friendlyAuthError(authError.message));
          return;
        }
        console.log("[Auth] signUp success, user:", data.user?.id);
        if (data.user) router.push("/onboarding");
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          console.error("[Auth] signIn error code:", authError.code);
          console.error("[Auth] signIn error message:", authError.message);
          console.error("[Auth] signIn error status:", authError.status);
          setError(friendlyAuthError(authError.message));
          return;
        }
        if (data.user) {
          const done = await isOnboardingComplete(data.user.id);
          router.push(done ? "/" : "/onboarding");
        }
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (process.env.NODE_ENV === "development") {
        console.error("[Auth] full error:", JSON.stringify(err, null, 2));
      }

      if (err instanceof Error && err.message === "SUPABASE_NOT_CONFIGURED") {
        setError("Supabase is not connected. Check environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).");
      } else {
        setError(friendlyAuthError(msg) || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#1c1c1c",
    border: "1px solid #252525",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#ffffff",
    outline: "none",
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="w-full max-w-[380px] space-y-8">

        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          <DumbbellLogo size={52} glow={0.5} />
          <div className="text-center">
            <p className="text-[28px] font-black tracking-tight" style={{ color: "#ffffff" }}>
              Smartfood
            </p>
            <p className="mt-1 text-sm" style={{ color: "#555555" }}>
              {mode === "login" ? "Sign in to continue" : "Create your account"}
            </p>
          </div>
        </div>

        {/* Debug panel — dev + preview only, never production */}
        {SHOW_DEBUG && (
          <div
            className="rounded-xl px-4 py-3 text-xs space-y-1 font-mono"
            style={{ backgroundColor: "#0d1a1f", border: "1px solid #1a3a44", color: "#4a9eb5" }}
          >
            <div style={{ color: "#888888", marginBottom: 4 }}>⚙ Supabase debug (non-production only)</div>
            <div>URL set: <span style={{ color: SUPABASE_URL ? "#00d2ff" : "#ff6060" }}>{SUPABASE_URL ? "yes" : "NO"}</span></div>
            {SUPABASE_URL && <div>URL host: <span style={{ color: "#ffffff" }}>{getUrlHost(SUPABASE_URL)}</span></div>}
            <div>Anon key set: <span style={{ color: SUPABASE_KEY ? "#00d2ff" : "#ff6060" }}>{SUPABASE_KEY ? "yes" : "NO"}</span></div>
          </div>
        )}

        {/* Mode toggle */}
        <div
          className="flex overflow-hidden rounded-2xl p-1"
          style={{ backgroundColor: "#141414", border: "1px solid #252525" }}
        >
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all"
              style={
                mode === m
                  ? { backgroundColor: "#1e1e1e", color: "#ffffff" }
                  : { backgroundColor: "transparent", color: "#444444" }
              }
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#252525")}
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#252525")}
            />
          </div>

          {mode === "signup" && (
            <div>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#252525")}
              />
            </div>
          )}

          {error && (
            <p
              className="rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.2)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: "#333333" }}>
          Your data is private and encrypted.
        </p>
      </div>
    </div>
  );
}
