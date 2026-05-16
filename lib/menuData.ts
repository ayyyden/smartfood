// ─── Types ───────────────────────────────────────────────────────────────────

export type FoodOption = {
  name:     string;
  portion:  string;
  calories: number;
  protein:  number;
  warning?: string;     // shown as warning badge
  contains: string[];   // tags for diet filtering: "meat","fish","shellfish","dairy","eggs","gluten","pork","nuts"
};

export type MealTier = "snack" | "small" | "main";

export type MealSlot = {
  id:       number;
  label:    string;
  role:     string;
  tier:     MealTier;
  ratioMin: number; // fraction of daily calories
  ratioMax: number;
  sharedWith?: number; // meal id this shares a pool with
};

// ─── Meal slot definitions ────────────────────────────────────────────────────
// Ratios sum to ~100 %: 11+22+34+22+11 = 100

export const MEAL_SLOTS: MealSlot[] = [
  { id: 1, label: "Meal 1", role: "Light Snack",  tier: "snack", ratioMin: 0.09, ratioMax: 0.13 },
  { id: 2, label: "Meal 2", role: "Small Meal",   tier: "small", ratioMin: 0.19, ratioMax: 0.25 },
  { id: 3, label: "Meal 3", role: "Main Lunch",   tier: "main",  ratioMin: 0.30, ratioMax: 0.38 },
  { id: 4, label: "Meal 4", role: "Small Meal",   tier: "small", ratioMin: 0.19, ratioMax: 0.25, sharedWith: 2 },
  { id: 5, label: "Meal 5", role: "Late Snack",   tier: "snack", ratioMin: 0.09, ratioMax: 0.13, sharedWith: 1 },
];

export function getMealCalRange(calorieGoal: number, slot: MealSlot): { min: number; max: number } {
  return {
    min: Math.round(calorieGoal * slot.ratioMin),
    max: Math.round(calorieGoal * slot.ratioMax),
  };
}

// ─── Protein options ──────────────────────────────────────────────────────────

const PROTEIN_SNACK: FoodOption[] = [
  { name: "Greek yogurt (plain)",    portion: "150g",       calories: 88,  protein: 13, contains: ["dairy"] },
  { name: "Egg whites",              portion: "3 whites",   calories: 51,  protein: 11, contains: ["eggs"] },
  { name: "Cottage cheese",          portion: "100g",       calories: 72,  protein: 12, contains: ["dairy"] },
  { name: "Tuna (canned, drained)",  portion: "50g",        calories: 58,  protein: 13, contains: ["fish"] },
  { name: "Hard-boiled egg",         portion: "1 large",    calories: 72,  protein:  6, contains: ["eggs"] },
  { name: "Turkey slices",           portion: "40g",        calories: 44,  protein:  9, contains: ["meat"] },
];

const PROTEIN_SMALL: FoodOption[] = [
  { name: "Chicken breast (cooked)", portion: "110g",       calories: 182, protein: 34, contains: ["meat"] },
  { name: "Tuna (canned, drained)",  portion: "90g",        calories: 104, protein: 23, contains: ["fish"] },
  { name: "2 whole eggs",            portion: "2 large",    calories: 144, protein: 12, contains: ["eggs"] },
  { name: "Cottage cheese",          portion: "200g",       calories: 144, protein: 24, contains: ["dairy"] },
  { name: "Salmon (cooked)",         portion: "90g",        calories: 187, protein: 18, contains: ["fish"] },
  { name: "Shrimp (cooked)",         portion: "100g",       calories:  99, protein: 24, contains: ["fish","shellfish"] },
  { name: "Tempeh",                  portion: "100g",       calories: 193, protein: 19, contains: [] },
  { name: "Lean ground beef",        portion: "100g cooked",calories: 152, protein: 26, contains: ["meat"] },
];

const PROTEIN_MAIN: FoodOption[] = [
  { name: "Chicken breast (cooked)", portion: "180g",       calories: 297, protein: 56, contains: ["meat"] },
  { name: "Salmon (cooked)",         portion: "150g",       calories: 312, protein: 30, contains: ["fish"] },
  { name: "Lean ground beef",        portion: "150g cooked",calories: 228, protein: 39, contains: ["meat"] },
  { name: "Turkey breast (cooked)",  portion: "180g",       calories: 198, protein: 41, contains: ["meat"] },
  { name: "Tuna steak (cooked)",     portion: "180g",       calories: 209, protein: 47, contains: ["fish"] },
  { name: "Firm tofu (pan-fried)",   portion: "200g",       calories: 196, protein: 20, contains: [] },
  { name: "Chicken thigh (no skin)", portion: "150g cooked",calories: 239, protein: 34, contains: ["meat"] },
];

// ─── Carb options ─────────────────────────────────────────────────────────────

const CARB_SNACK: FoodOption[] = [
  { name: "Rice cake",               portion: "1 piece",    calories:  35, protein:  1, contains: [] },
  { name: "Apple or pear",           portion: "1 medium",   calories:  78, protein:  0, contains: [] },
  { name: "Banana (small)",          portion: "80g",        calories:  71, protein:  1, contains: [] },
  { name: "Berries",                 portion: "1 cup 120g", calories:  50, protein:  1, contains: [] },
  { name: "Small tortilla",          portion: "30g",        calories:  75, protein:  2, contains: ["gluten"] },
  { name: "Oat bar (low sugar)",     portion: "30g",        calories: 120, protein:  3, contains: [] },
];

const CARB_SMALL: FoodOption[] = [
  { name: "White rice (cooked)",     portion: "100g",       calories: 130, protein:  3, contains: [] },
  { name: "Oats (cooked)",           portion: "200g",       calories:  70, protein:  2, contains: [] },
  { name: "Medium tortilla",         portion: "50g",        calories: 125, protein:  3, contains: ["gluten"] },
  { name: "Whole wheat bread",       portion: "2 slices",   calories: 138, protein:  6, contains: ["gluten"] },
  { name: "Pasta (cooked)",          portion: "100g",       calories: 158, protein:  6, contains: ["gluten"] },
  { name: "Sweet potato (baked)",    portion: "100g",       calories:  86, protein:  2, contains: [],
    warning: "Starchy — measure this" },
  { name: "Pita bread",              portion: "60g",        calories: 165, protein:  5, contains: ["gluten"] },
];

const CARB_MAIN: FoodOption[] = [
  { name: "White rice (cooked)",     portion: "180g",       calories: 234, protein:  5, contains: [] },
  { name: "Brown rice (cooked)",     portion: "180g",       calories: 216, protein:  5, contains: [] },
  { name: "Pasta (cooked)",          portion: "160g",       calories: 253, protein: 10, contains: ["gluten"] },
  { name: "Large tortilla",          portion: "70g",        calories: 175, protein:  5, contains: ["gluten"] },
  { name: "Baked potato",            portion: "150g",       calories: 130, protein:  3, contains: [],
    warning: "Starchy — measure this" },
  { name: "Sweet potato (baked)",    portion: "150g",       calories: 129, protein:  3, contains: [],
    warning: "Starchy — measure this" },
  { name: "Pita + rice combo",       portion: "50g pita + 100g rice", calories: 212, protein:  6, contains: ["gluten"] },
];

// ─── Veggie options (shared across all tiers) ─────────────────────────────────

export const VEGGIE_OPTIONS: FoodOption[] = [
  { name: "Cucumber",            portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Lettuce / greens",    portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Spinach",             portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Cabbage (raw)",       portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Celery",              portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Bell pepper",         portion: "1 medium",   calories: 31, protein: 1, contains: [] },
  { name: "Tomato",              portion: "1 medium",   calories: 22, protein: 1, contains: [] },
  { name: "Broccoli (cooked)",   portion: "100g",       calories: 55, protein: 4, contains: [] },
  { name: "Zucchini (cooked)",   portion: "100g",       calories: 17, protein: 1, contains: [] },
];

// ─── Food pool map ────────────────────────────────────────────────────────────

export type TierFoods = {
  protein: FoodOption[];
  carbs:   FoodOption[];
  veggies: FoodOption[];
};

export const TIER_FOODS: Record<MealTier, TierFoods> = {
  snack: { protein: PROTEIN_SNACK, carbs: CARB_SNACK, veggies: VEGGIE_OPTIONS },
  small: { protein: PROTEIN_SMALL, carbs: CARB_SMALL, veggies: VEGGIE_OPTIONS },
  main:  { protein: PROTEIN_MAIN,  carbs: CARB_MAIN,  veggies: VEGGIE_OPTIONS },
};

// ─── Diet rule filtering ──────────────────────────────────────────────────────

const RULE_EXCLUDES: Record<string, string[]> = {
  vegan:       ["meat", "pork", "fish", "shellfish", "dairy", "eggs"],
  vegetarian:  ["meat", "pork", "fish", "shellfish"],
  kosher:      ["pork", "shellfish"],
  halal:       ["pork", "shellfish"],
  dairy_free:  ["dairy"],
  gluten_free: ["gluten"],
  no_pork:     ["pork"],
  no_shellfish:["shellfish"],
  no_eggs:     ["eggs"],
  no_fish:     ["fish", "shellfish"],
  nut_free:    ["nuts"],
  // these don't exclude individual foods:
  low_carb: [], keto: [], paleo: [],
};

export function filterByDiet(options: FoodOption[], dietRules: string[]): FoodOption[] {
  if (dietRules.length === 0) return options;
  const excluded = new Set<string>();
  for (const rule of dietRules) {
    (RULE_EXCLUDES[rule] ?? []).forEach((t) => excluded.add(t));
  }
  if (excluded.size === 0) return options;
  return options.filter((opt) => !opt.contains.some((tag) => excluded.has(tag)));
}

export function filterByDisliked(options: FoodOption[], disliked: string[]): FoodOption[] {
  if (disliked.length === 0) return options;
  return options.filter(
    (opt) => !disliked.some((word) => opt.name.toLowerCase().includes(word.toLowerCase())),
  );
}

// ─── Warning foods guide ──────────────────────────────────────────────────────

export const WARNING_FOODS = [
  { name: "Avocado",       note: "½ avocado ≈ 120 cal" },
  { name: "Corn",          note: "Starchy — measure this" },
  { name: "Olives",        note: "Higher calorie — count them" },
  { name: "Potatoes",      note: "Starchy — measure this" },
  { name: "Sweet potato",  note: "Starchy — measure this" },
  { name: "Tahini",        note: "1 tbsp ≈ 90 cal" },
  { name: "Olive oil",     note: "1 tbsp ≈ 120 cal" },
  { name: "Nuts",          note: "30g ≈ 175 cal" },
  { name: "Peanut butter", note: "2 tbsp ≈ 190 cal" },
  { name: "Hummus",        note: "50g ≈ 90 cal" },
  { name: "Dates",         note: "Easy to overeat — count them" },
  { name: "Granola",       note: "30g ≈ 130 cal" },
];

// ─── Sauces guide ─────────────────────────────────────────────────────────────

export const SAUCES_FREE = [
  "Salt & pepper", "Garlic powder", "Paprika", "Chili flakes",
  "Hot sauce (~5 cal/tsp)", "Mustard (~15 cal/tbsp)",
  "Lemon juice (~4 cal/tbsp)", "Vinegar (~3 cal/tbsp)",
  "Low-cal ketchup (~10 cal/tbsp)",
];

export const SAUCES_CAREFUL = [
  "Regular ketchup (~20 cal/tbsp)",
  "Mayo (~100 cal/tbsp)",
  "BBQ sauce (~40 cal/2 tbsp)",
  "Sweet chili sauce (~35 cal/tbsp)",
  "Tahini (~90 cal/tbsp)",
  "Olive oil (~120 cal/tbsp)",
  "Salad dressing (~80–150 cal/2 tbsp)",
];
