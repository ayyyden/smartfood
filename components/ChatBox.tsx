"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { mockParse } from "@/lib/mockParser";
import type { ParseFoodResponse, ParseFoodError, FoodItem } from "@/lib/types";
import { validateAndSanitize } from "@/lib/validateNutrition";

type ChatStatus = "idle" | "loading" | "awaiting_followup";

export default function ChatBox() {
  const { dispatch } = useApp();

  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [optionalTip, setOptionalTip] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expanded) {
      const t = setTimeout(() => textareaRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  function resetChat() {
    setMessage("");
    setStatus("idle");
    setPendingContext(null);
    setFollowUpQuestion(null);
    setOptionalTip(null);
    setExpanded(false);
  }

  function addEntry(
    text: string,
    parsed: { calories: number; protein: number; carbs: number; fat: number },
    items?: FoodItem[],
  ) {
    const validation = validateAndSanitize(parsed);

    let values: { calories: number; protein: number; carbs: number; fat: number };
    let savedItems: FoodItem[] | undefined;

    if (validation.ok) {
      values = validation.values;
      savedItems = items;
    } else {
      console.warn("[ChatBox] AI nutrition failed client validation, using mock:", validation.reason);
      const mock = mockParse(text);
      values = { calories: mock.calories, protein: mock.protein, carbs: mock.carbs, fat: mock.fat };
      savedItems = undefined;
    }

    dispatch({
      type: "ADD_ENTRY",
      payload: {
        id: crypto.randomUUID(),
        text,
        time: new Date().toISOString(),
        ...values,
        items: savedItems,
      },
    });
  }

  async function handleSend() {
    const text = message.trim();
    if (!text) return;

    setStatus("loading");
    setMessage("");

    try {
      const body =
        status === "awaiting_followup" && pendingContext
          ? { text, context: pendingContext }
          : { text };

      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: ParseFoodResponse | ParseFoodError = await res.json();

      if ("fallback" in data) {
        const originalText = pendingContext ?? text;
        addEntry(originalText, mockParse(originalText));
        resetChat();
        return;
      }

      if (data.needsFollowUp && data.followUpQuestion) {
        setPendingContext(pendingContext ?? text);
        setFollowUpQuestion(data.followUpQuestion);
        setOptionalTip(data.optionalTip ?? null);
        setStatus("awaiting_followup");
        setTimeout(() => textareaRef.current?.focus(), 80);
      } else {
        const originalText = pendingContext ?? text;
        addEntry(originalText, data, data.items);
        resetChat();
      }
    } catch {
      const originalText = pendingContext ?? text;
      addEntry(originalText, mockParse(originalText));
      resetChat();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const expandedHeight =
    status === "awaiting_followup"
      ? optionalTip ? 310 : 268
      : status === "loading" && pendingContext !== null
      ? 258
      : 188;

  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{
        backgroundColor: "var(--sf-bg)",
        borderTop: "1px solid var(--sf-border)",
        boxShadow: "0 -8px 32px var(--sf-shadow)",
        height: expanded ? expandedHeight : 68,
        transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ── Collapsed ── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex h-full w-full items-center gap-3 px-4"
          aria-label="Open food log input"
        >
          <div
            className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
          >
            <span className="text-sm" style={{ color: "var(--sf-placeholder)" }}>
              What did you eat?
            </span>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#00d2ff" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
        </button>
      )}

      {/* ── Expanded ── */}
      {expanded && (
        <div className="flex h-full flex-col px-4 pt-3.5 pb-3">
          {/* Header */}
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              {status === "awaiting_followup" ? "One quick question" : "Log meal or workout"}
            </span>
            <button
              onClick={resetChat}
              aria-label="Close"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--sf-text6)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
              <div
                className="h-5 w-5 animate-spin rounded-full border-2"
                style={{ borderColor: "var(--sf-input)", borderTopColor: "#00d2ff" }}
              />
              <p className="text-xs font-medium" style={{ color: "var(--sf-text6)" }}>
                Analyzing your meal…
              </p>
            </div>
          )}

          {/* Follow-up */}
          {status === "awaiting_followup" && followUpQuestion && (
            <div className="mb-2.5 space-y-2">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: "var(--sf-border)" }}
              >
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--sf-text1)" }}>
                  {followUpQuestion}
                </p>
              </div>
              {optionalTip && (
                <p className="px-1 text-[11px] leading-snug" style={{ color: "var(--sf-text6)" }}>
                  <span className="font-semibold" style={{ color: "var(--sf-text5)" }}>Tip:</span>{" "}
                  {optionalTip}
                </p>
              )}
            </div>
          )}

          {/* Input row */}
          {status !== "loading" && (
            <div className="flex flex-1 items-end gap-2.5">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status === "awaiting_followup"
                    ? "Type your answer…"
                    : "e.g. 250g rice, 200g chicken"
                }
                rows={status === "awaiting_followup" ? 2 : 3}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm transition-colors focus:outline-none"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  border: "1px solid var(--sf-border2)",
                  color: "var(--sf-text2)",
                  caretColor: "#00d2ff",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,210,255,0.06)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--sf-border2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                aria-label="Send"
                className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                  backgroundColor: "#00d2ff",
                  opacity: message.trim() ? 1 : 0.25,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
