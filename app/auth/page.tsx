"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DumbbellLogo from "@/components/DumbbellLogo";
import { isOnboardingComplete } from "@/lib/db/profiles";

type Mode = "login" | "signup";

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
        // Log the full error object so it appears in Vercel function logs
        if (authError) {
          console.error("[Auth] signUp error:", JSON.stringify(authError));
          setError(authError.message);
          return;
        }
        if (data.user) router.push("/onboarding");
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          console.error("[Auth] signInWithPassword error:", JSON.stringify(authError));
          setError(authError.message);
          return;
        }
        if (data.user) {
          const done = await isOnboardingComplete(data.user.id);
          router.push(done ? "/" : "/onboarding");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Auth] Unexpected throw:", msg);

      if (msg === "SUPABASE_NOT_CONFIGURED") {
        setError("Supabase is not connected. Check environment variables.");
      } else if (
        msg.includes("Load failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.toLowerCase().includes("network")
      ) {
        setError(
          "Network error — cannot reach Supabase. " +
          "Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel."
        );
      } else {
        setError(msg || "Something went wrong. Please try again.");
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
