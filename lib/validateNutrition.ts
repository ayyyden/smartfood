export type MacroValues = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// Hard limits per single food log entry
export const ENTRY_LIMITS: Record<keyof MacroValues, number> = {
  calories: 5000,
  protein:  300,
  carbs:    800,
  fat:      300,
};

// Beyond 5x the limit = AI hallucination, reject entirely
const REJECT_MULTIPLIER = 5;

export type ValidationResult =
  | { ok: true;  values: MacroValues }
  | { ok: false; reason: string };

export function validateAndSanitize(raw: MacroValues): ValidationResult {
  const fields = ["calories", "protein", "carbs", "fat"] as const;

  for (const field of fields) {
    const v = raw[field];
    if (!Number.isFinite(v) || isNaN(v)) {
      console.warn(`[nutrition] ${field} is not a finite number: ${v}`);
      return { ok: false, reason: `${field} is not a valid number (got ${v})` };
    }
    if (v < 0) {
      console.warn(`[nutrition] ${field} is negative: ${v}`);
      return { ok: false, reason: `${field} cannot be negative (got ${v})` };
    }
    const limit = ENTRY_LIMITS[field];
    if (v > limit * REJECT_MULTIPLIER) {
      console.warn(`[nutrition] ${field} rejected: ${v} — exceeds reject threshold ${limit * REJECT_MULTIPLIER}`);
      return { ok: false, reason: `${field} value ${v} is impossible for a single meal (max allowed: ${limit})` };
    }
  }

  // Values are sane — clamp to limits and round
  return {
    ok: true,
    values: {
      calories: Math.round(Math.min(raw.calories, ENTRY_LIMITS.calories)),
      protein:  Math.round(Math.min(raw.protein,  ENTRY_LIMITS.protein)  * 10) / 10,
      carbs:    Math.round(Math.min(raw.carbs,     ENTRY_LIMITS.carbs)    * 10) / 10,
      fat:      Math.round(Math.min(raw.fat,       ENTRY_LIMITS.fat)      * 10) / 10,
    },
  };
}
