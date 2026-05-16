// ─── Types ────────────────────────────────────────────────────────────────────

export type ServingUnit =
  | "g" | "oz" | "cup" | "tbsp" | "tsp" | "piece" | "slice" | "serving" | "custom";

export type LogUnit = "serving" | "g" | "oz";

export type CustomFood = {
  id:              string;
  name:            string;
  brand?:          string;
  servingAmount:   number;
  servingUnit:     ServingUnit;
  customUnitName?: string;
  gramsPerServing?: number;   // enables g/oz logging in builder
  calories:        number;    // per one serving
  protein:         number;
  carbs:           number;
  fat:             number;
  isFavorite?:     boolean;
  isVerified?:     boolean;   // future: admin-approved shared food
  createdAt:       string;
  basisGrams?:     number;    // legacy — kept for backwards compat
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const PRO_FOODS_KEY = "smartfood_pro_foods";

function migrateFood(raw: Record<string, unknown>): CustomFood {
  if ("basisGrams" in raw && !("servingAmount" in raw)) {
    const basisGrams = Math.max(Number(raw.basisGrams) || 100, 1);
    return {
      ...(raw as unknown as CustomFood),
      servingAmount:   basisGrams,
      servingUnit:     "g",
      gramsPerServing: basisGrams,
      basisGrams,
    };
  }
  return raw as unknown as CustomFood;
}

export function loadProFoods(): CustomFood[] {
  try {
    const raw = localStorage.getItem(PRO_FOODS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    const migrated = (parsed as Record<string, unknown>[]).map(migrateFood);
    localStorage.setItem(PRO_FOODS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

export function saveProFoods(foods: CustomFood[]): void {
  try {
    localStorage.setItem(PRO_FOODS_KEY, JSON.stringify(foods));
  } catch {}
}

// ─── Serving helpers ──────────────────────────────────────────────────────────

/** Returns gramsPerServing for unit types whose gram equivalent is known exactly. */
export function autoGramsPerServing(
  amount: number,
  unit: ServingUnit,
): number | undefined {
  if (unit === "g")  return amount;
  if (unit === "oz") return Math.round(amount * 28.3495);
  return undefined;
}

/** Human-readable serving string, e.g. "100g", "1 cup (158g)", "2 pieces". */
export function formatServing(food: CustomFood): string {
  const unitLabel =
    food.servingUnit === "custom"
      ? (food.customUnitName || "serving")
      : food.servingUnit;
  const base = `${food.servingAmount} ${unitLabel}`;
  if (food.gramsPerServing && food.servingUnit !== "g") {
    return `${base} (${food.gramsPerServing}g)`;
  }
  return base;
}

/** Units available in the meal builder for a given food. */
export function getLogUnits(food: CustomFood): Array<{ unit: LogUnit; label: string }> {
  const units: Array<{ unit: LogUnit; label: string }> = [
    { unit: "serving", label: formatServing(food) },
  ];
  if (food.gramsPerServing) {
    units.push({ unit: "g",  label: "g"  });
    units.push({ unit: "oz", label: "oz" });
  }
  return units;
}

/** Default unit pre-selected in the meal builder. */
export function defaultLogUnit(food: CustomFood): LogUnit {
  if (food.servingUnit === "g")  return "g";
  if (food.servingUnit === "oz") return "oz";
  return "serving";
}

/** Default amount pre-filled in the meal builder. */
export function defaultLogAmount(food: CustomFood): string {
  if (food.servingUnit === "g" || food.servingUnit === "oz") {
    return String(food.servingAmount);
  }
  return "1";
}

/** Convert a user-entered amount + unit to a number of servings. */
export function toServings(food: CustomFood, amount: number, unit: LogUnit): number {
  if (unit === "serving") return amount;
  const gps = food.gramsPerServing;
  if (!gps) return 0;
  if (unit === "g")  return amount / gps;
  if (unit === "oz") return (amount * 28.3495) / gps;
  return 0;
}

/** Scale a macro value by number of servings. */
export function scaleMacro(valuePerServing: number, servings: number): number {
  return Math.round(valuePerServing * servings);
}

// ─── Built-in food favorites ──────────────────────────────────────────────────

const BUILTIN_FAVORITES_KEY = "smartfood_builtin_favorites";

export function loadBuiltinFavorites(): string[] {
  try {
    const raw = localStorage.getItem(BUILTIN_FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch { return []; }
}

export function saveBuiltinFavorites(ids: string[]): void {
  try { localStorage.setItem(BUILTIN_FAVORITES_KEY, JSON.stringify(ids)); } catch {}
}
