"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { upsertProfile } from "@/lib/db/profiles";
import {
  type Profile,
  type Gender,
  type FitnessGoal,
  type ActivityLevel,
  DEFAULT_PROFILE,
  calculateRecommended,
  deriveMacros,
  calculateAge,
  GOAL_CAL_OFFSET,
} from "@/lib/profile";
import DumbbellLogo from "@/components/DumbbellLogo";

const TOTAL_STEPS = 5;

// ─── Small helpers ────────────────────────────────────────────────────────────

function kgToLb(kg: number) { return Math.round(kg * 2.2046 * 10) / 10; }
function lbToKg(lb: number) { return Math.round((lb / 2.2046) * 10) / 10; }
function cmToIn(cm: number) { return Math.round((cm / 2.54) * 10) / 10; }
function inToCm(i: number)  { return Math.round(i * 2.54 * 10) / 10; }

function PillGroup({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.12)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.35)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPill({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button key={o.value} type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.12)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.35)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--sf-input)",
  border: "1px solid var(--sf-border2)",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  color: "var(--sf-text1)",
  outline: "none",
};

function NumInput({ value, onChange, placeholder, unit }: {
  value: number | ""; onChange: (v: number | "") => void; placeholder: string; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={{ ...inputStyle, flex: 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
      />
      {unit && <span className="text-sm w-8 shrink-0" style={{ color: "var(--sf-text4)" }}>{unit}</span>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--sf-text5)" }}>{children}</p>;
}

const GENDER_OPTS   = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }];
const GOAL_OPTS     = [{ value: "lose", label: "Lose weight" }, { value: "maintain", label: "Maintain" }, { value: "gain", label: "Gain muscle" }];
const ACTIVITY_OPTS = [
  { value: "sedentary",   label: "Sedentary" },
  { value: "light",       label: "Light" },
  { value: "moderate",    label: "Moderate" },
  { value: "active",      label: "Active" },
  { value: "very_active", label: "Very active" },
];
const ACTIVITY_DESC: Record<string, string> = {
  sedentary:   "Desk job, little or no exercise",
  light:       "Light exercise 1–2 days/week",
  moderate:    "Moderate exercise 3–5 days/week",
  active:      "Hard exercise 6–7 days/week",
  very_active: "Athlete or physical job",
};
const DIET_OPTS = [
  { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" },
  { value: "kosher", label: "Kosher" }, { value: "halal", label: "Halal" },
  { value: "gluten_free", label: "Gluten-Free" }, { value: "dairy_free", label: "Dairy-Free" },
  { value: "nut_free", label: "Nut-Free" }, { value: "low_carb", label: "Low-Carb" },
  { value: "keto", label: "Keto" }, { value: "paleo", label: "Paleo" },
  { value: "no_pork", label: "No Pork" }, { value: "no_shellfish", label: "No Shellfish" },
];

// ─── Error helper ─────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE });
  // String states so the user can clear and retype without getting stuck at 0
  const [calInput, setCalInput] = useState(String(DEFAULT_PROFILE.calorieGoal));
  const [proteinInput, setProteinInput] = useState(String(DEFAULT_PROFILE.proteinGoalG));

  const isImperial  = profile.unitSystem === "imperial";
  const rec         = calculateRecommended(profile);
  const age         = calculateAge(profile.dateOfBirth);

  // Keep string inputs in sync when profile recalculates (e.g. user picks a new goal)
  useEffect(() => { setCalInput(String(profile.calorieGoal)); }, [profile.calorieGoal]);
  useEffect(() => { setProteinInput(String(profile.proteinGoalG)); }, [profile.proteinGoalG]);

  const dispHeight  = profile.heightCm    === "" ? "" : isImperial ? cmToIn(profile.heightCm)    : profile.heightCm;
  const dispWeight  = profile.weightKg    === "" ? "" : isImperial ? kgToLb(profile.weightKg)    : profile.weightKg;
  const dispGoalWt  = profile.goalWeightKg=== "" ? "" : isImperial ? kgToLb(profile.goalWeightKg): profile.goalWeightKg;

  function update(updates: Partial<Profile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      const r = calculateRecommended(next);
      if (r && !next.calorieOverridden) {
        next.calorieGoal  = r.calories;
        next.proteinGoalG = r.protein;
        next.recommendedCalories = r.calories;
        const m = deriveMacros(r.calories, next.goal);
        next.carbsGoalG = m.carbs;
        next.fatGoalG   = m.fat;
      } else {
        next.recommendedCalories = r?.calories ?? null;
      }
      return next;
    });
  }

  async function finish() {
    if (!user) { setSaveError("Not signed in. Please log in again."); return; }
    setSaving(true);
    setSaveError("");
    try {
      await upsertProfile(user.id, { ...profile, onboardingCompleted: true });
      dispatch({
        type: "SET_GOALS",
        payload: {
          calories: profile.calorieGoal,
          protein:  profile.proteinGoalG,
          carbs:    profile.carbsGoalG,
          fat:      profile.fatGoalG,
        },
      });
      router.push("/");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Onboarding] full error:", JSON.stringify(err, null, 2));
      }
      setSaveError(getErrorMessage(err) || "Failed to save profile. Please try again.");
      setSaving(false);
    }
  }

  const pct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--sf-bg)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-6">
        <DumbbellLogo size={28} glow={0.35} />
        <p className="text-lg font-black" style={{ color: "var(--sf-text1)" }}>Smartfood</p>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="overflow-hidden rounded-full" style={{ height: "3px", backgroundColor: "var(--sf-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: "#00d2ff", boxShadow: "0 0 8px rgba(0,210,255,0.5)" }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--sf-text5)" }}>Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>Tell us about yourself</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>We use this to personalize your goals</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Date of birth</Label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => update({ dateOfBirth: e.target.value })}
                  style={{ ...inputStyle }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
                {age && <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>Age: <span style={{ color: "#00d2ff" }}>{age}</span></p>}
              </div>

              <div>
                <Label>Gender</Label>
                <PillGroup options={GENDER_OPTS} value={profile.gender} onChange={(v) => update({ gender: v as Gender })} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Body ── */}
        {step === 2 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>Your body</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>We'll calculate your calorie needs</p>
            </div>

            <div className="space-y-4">
              {/* Units */}
              <div>
                <Label>Units</Label>
                <div className="flex overflow-hidden rounded-2xl" style={{ border: "1px solid var(--sf-border2)" }}>
                  <button type="button" onClick={() => update({ unitSystem: "metric" })}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={!isImperial ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" } : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}>
                    Metric (kg/cm)
                  </button>
                  <button type="button" onClick={() => update({ unitSystem: "imperial" })}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={isImperial ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" } : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}>
                    Imperial (lb/in)
                  </button>
                </div>
              </div>

              <div>
                <Label>Height</Label>
                <NumInput value={dispHeight} placeholder={isImperial ? "70" : "175"}
                  unit={isImperial ? "in" : "cm"}
                  onChange={(v) => update({ heightCm: v === "" ? "" : isImperial ? inToCm(v) : v })} />
              </div>

              <div>
                <Label>Current weight</Label>
                <NumInput value={dispWeight} placeholder={isImperial ? "170" : "77"}
                  unit={isImperial ? "lb" : "kg"}
                  onChange={(v) => update({ weightKg: v === "" ? "" : isImperial ? lbToKg(v) : v })} />
              </div>

              <div>
                <Label>Goal weight</Label>
                <NumInput value={dispGoalWt} placeholder={isImperial ? "155" : "70"}
                  unit={isImperial ? "lb" : "kg"}
                  onChange={(v) => update({ goalWeightKg: v === "" ? "" : isImperial ? lbToKg(v) : v })} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Goal ── */}
        {step === 3 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>Your goal</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>What are you working toward?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>I want to</Label>
                <PillGroup options={GOAL_OPTS} value={profile.goal} onChange={(v) => update({ goal: v as FitnessGoal })} />
              </div>

              <div>
                <Label>Activity level</Label>
                <PillGroup options={ACTIVITY_OPTS} value={profile.activityLevel}
                  onChange={(v) => update({ activityLevel: v as ActivityLevel })} />
                {profile.activityLevel && (
                  <p className="mt-2 text-xs" style={{ color: "var(--sf-text5)" }}>
                    {ACTIVITY_DESC[profile.activityLevel]}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Calorie target ── */}
        {step === 4 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>Your targets</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>Based on your stats. You can override anytime.</p>
            </div>

            <div className="space-y-4">
              {/* Recommendation */}
              <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}>
                {rec ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text5)" }}>Recommended</p>
                      <p className="mt-0.5 text-2xl font-black" style={{ color: "#00d2ff" }}>
                        {rec.calories.toLocaleString()}
                        <span className="ml-1 text-sm font-normal" style={{ color: "var(--sf-text4)" }}>cal/day</span>
                      </p>
                    </div>
                    <p className="text-right text-xs leading-snug" style={{ color: "var(--sf-text5)" }}>
                      Based on your<br />stats &amp; goal
                    </p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--sf-text4)" }}>
                    Complete your stats in steps 1–3 to see a recommendation.
                  </p>
                )}
              </div>

              <div>
                <Label>Daily calorie goal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={800}
                    max={8000}
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                    onBlur={() => {
                      const cal = Math.max(800, Number(calInput) || profile.calorieGoal);
                      const overridden = rec ? cal !== rec.calories : true;
                      const m = deriveMacros(cal, profile.goal);
                      setProfile((p) => ({ ...p, calorieGoal: cal, calorieOverridden: overridden, carbsGoalG: m.carbs, fatGoalG: m.fat }));
                    }}
                    style={{ ...inputStyle, flex: 1, color: "#00d2ff", fontWeight: 800 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  />
                  <span className="text-sm" style={{ color: "var(--sf-text4)" }}>cal</span>
                </div>
              </div>

              <div>
                <Label>Daily protein goal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={30}
                    value={proteinInput}
                    onChange={(e) => setProteinInput(e.target.value)}
                    onBlur={() => {
                      const protein = Math.max(30, Number(proteinInput) || profile.proteinGoalG);
                      setProfile((p) => ({ ...p, proteinGoalG: protein }));
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  />
                  <span className="text-sm" style={{ color: "var(--sf-text4)" }}>g</span>
                </div>
                {rec && <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>Recommended: {rec.protein}g</p>}
              </div>

              {/* Weight rate estimate */}
              {(() => {
                if (!rec || !profile.goal) return null;
                const offset = GOAL_CAL_OFFSET[profile.goal] ?? 0;
                const tdee = rec.calories - offset;
                const dailyDelta = profile.calorieGoal - tdee;
                const kgPerWeek = Math.round(dailyDelta * 7 / 7700 * 10) / 10;
                const dispChange = isImperial
                  ? Math.round(kgPerWeek * 2.2046 * 10) / 10
                  : kgPerWeek;
                const unit = isImperial ? "lb" : "kg";
                const isLoss = kgPerWeek < -0.05;
                const isGain = kgPerWeek > 0.05;
                return (
                  <div
                    className="rounded-2xl px-4 py-3.5 space-y-1"
                    style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
                  >
                    {isLoss ? (
                      <p className="text-sm" style={{ color: "#4ade80" }}>
                        At {profile.calorieGoal.toLocaleString()} cal/day, estimated loss is about{" "}
                        <strong>{Math.abs(dispChange).toFixed(1)} {unit}/week</strong>.
                      </p>
                    ) : isGain ? (
                      <p className="text-sm" style={{ color: "#fb923c" }}>
                        At {profile.calorieGoal.toLocaleString()} cal/day, estimated gain is about{" "}
                        <strong>{dispChange.toFixed(1)} {unit}/week</strong>.
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--sf-text4)" }}>
                        At {profile.calorieGoal.toLocaleString()} cal/day, you&apos;re approximately maintaining your weight.
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "var(--sf-text5)" }}>
                      Estimate only — actual results vary by individual.
                    </p>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* ── Step 5: Food preferences ── */}
        {step === 5 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>Food preferences</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>Helps the AI make better suggestions</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Dietary restrictions</Label>
                <MultiPill options={DIET_OPTS} value={profile.dietRules}
                  onChange={(v) => setProfile((p) => ({ ...p, dietRules: v }))} />
              </div>

              <div>
                <Label>Foods you enjoy</Label>
                <textarea
                  rows={2}
                  placeholder="e.g. chicken, rice, salads, yogurt…"
                  value={profile.foodPreferences ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, foodPreferences: e.target.value }))}
                  style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
              </div>

              <div>
                <Label>Foods you dislike</Label>
                <textarea
                  rows={2}
                  placeholder="e.g. mushrooms, olives, spicy food…"
                  value={profile.dislikedFoods ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, dislikedFoods: e.target.value }))}
                  style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
              </div>
            </div>
          </>
        )}

      </div>

      {/* Footer navigation */}
      <div className="px-5 pb-10 pt-4 space-y-3">
        {saveError && (
          <p
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.2)" }}
          >
            {saveError}
          </p>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            {saving ? "Saving…" : "Get started"}
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-full rounded-2xl py-3 text-sm font-semibold"
            style={{ color: "var(--sf-text4)" }}
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full text-xs"
            style={{ color: "var(--sf-text6)" }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
