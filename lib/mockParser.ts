// Placeholder parser — replaced by real Claude AI in Step 3.
// Returns approximate macros based on simple keyword detection.

export type ParsedFood = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function mockParse(text: string): ParsedFood {
  const t = text.toLowerCase();

  // ── Combo meals (check before individual foods) ───────────
  if (t.includes("chicken") && (t.includes("rice") || t.includes("quinoa"))) {
    return { calories: 550, protein: 52, carbs: 58, fat: 12 };
  }
  if (t.includes("chicken") && t.includes("pasta")) {
    return { calories: 490, protein: 40, carbs: 55, fat: 10 };
  }
  if (t.includes("rice") && t.includes("egg")) {
    return { calories: 380, protein: 15, carbs: 55, fat: 10 };
  }

  // ── Proteins ──────────────────────────────────────────────
  if (t.includes("chicken breast")) return { calories: 280, protein: 35, carbs: 0, fat: 8 };
  if (t.includes("chicken thigh"))  return { calories: 350, protein: 30, carbs: 0, fat: 14 };
  if (t.includes("chicken"))        return { calories: 300, protein: 33, carbs: 0, fat: 10 };
  if (t.includes("salmon"))         return { calories: 320, protein: 30, carbs: 0, fat: 19 };
  if (t.includes("tuna"))           return { calories: 180, protein: 32, carbs: 0, fat: 4 };
  if (t.includes("fish"))           return { calories: 250, protein: 28, carbs: 0, fat: 12 };
  if (t.includes("steak") || t.includes("beef")) return { calories: 420, protein: 38, carbs: 0, fat: 26 };
  if (t.includes("turkey"))         return { calories: 260, protein: 36, carbs: 0, fat: 6 };
  if (t.includes("egg"))            return { calories: 155, protein: 13, carbs: 1, fat: 11 };
  if (t.includes("greek yogurt") || t.includes("yogurt")) return { calories: 150, protein: 12, carbs: 18, fat: 4 };
  if (t.includes("cottage cheese")) return { calories: 110, protein: 14, carbs: 4, fat: 5 };

  // ── Carbs ─────────────────────────────────────────────────
  if (t.includes("oatmeal") || t.includes("oat")) return { calories: 300, protein: 10, carbs: 54, fat: 6 };
  if (t.includes("rice"))           return { calories: 240, protein: 5, carbs: 52, fat: 1 };
  if (t.includes("pasta") || t.includes("spaghetti")) return { calories: 380, protein: 13, carbs: 72, fat: 5 };
  if (t.includes("bread") || t.includes("toast"))     return { calories: 180, protein: 7, carbs: 36, fat: 3 };
  if (t.includes("sandwich") || t.includes("wrap"))   return { calories: 380, protein: 20, carbs: 44, fat: 13 };
  if (t.includes("pizza"))          return { calories: 570, protein: 22, carbs: 68, fat: 22 };
  if (t.includes("burger"))         return { calories: 540, protein: 30, carbs: 45, fat: 24 };
  if (t.includes("tortilla"))       return { calories: 200, protein: 5, carbs: 34, fat: 5 };
  if (t.includes("potato") || t.includes("fries")) return { calories: 320, protein: 5, carbs: 60, fat: 8 };

  // ── Fruits & vegetables ───────────────────────────────────
  if (t.includes("banana"))         return { calories: 105, protein: 1, carbs: 27, fat: 0 };
  if (t.includes("apple"))          return { calories: 80, protein: 0, carbs: 21, fat: 0 };
  if (t.includes("orange"))         return { calories: 65, protein: 1, carbs: 16, fat: 0 };
  if (t.includes("avocado"))        return { calories: 240, protein: 3, carbs: 13, fat: 22 };
  if (t.includes("salad"))          return { calories: 130, protein: 6, carbs: 12, fat: 7 };

  // ── Default fallback ──────────────────────────────────────
  return { calories: 350, protein: 20, carbs: 42, fat: 12 };
}
