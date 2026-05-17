// ─── Types ───────────────────────────────────────────────────────────────────

export type FoodOption = {
  name:       string;
  nameHe?:    string;
  portion:    string;
  calories:   number;
  protein:    number;
  warning?:   string;
  warningHe?: string;
  contains:   string[];   // tags for diet filtering: "meat","fish","shellfish","dairy","eggs","gluten","pork","nuts"
};

export type SauceItem = {
  name:    string;
  nameHe?: string;
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
  { name: "Greek yogurt (plain)",    nameHe: "יוגורט יווני טבעי",    portion: "150g",     calories: 88,  protein: 13, contains: ["dairy"] },
  { name: "Egg whites",              nameHe: "חלבוני ביצה",          portion: "3 whites", calories: 51,  protein: 11, contains: ["eggs"] },
  { name: "Cottage cheese",          nameHe: "קוטג׳",                portion: "100g",     calories: 72,  protein: 12, contains: ["dairy"] },
  { name: "Tuna (canned, drained)",  nameHe: "טונה (שימור, מסונן)",  portion: "50g",      calories: 58,  protein: 13, contains: ["fish"] },
  { name: "Hard-boiled egg",         nameHe: "ביצה קשה",             portion: "1 large",  calories: 72,  protein:  6, contains: ["eggs"] },
  { name: "Turkey slices",           nameHe: "פרוסות הודו",           portion: "40g",      calories: 44,  protein:  9, contains: ["meat"] },
];

const PROTEIN_SMALL: FoodOption[] = [
  { name: "Chicken breast (cooked)", nameHe: "חזה עוף מבושל",        portion: "110g",          calories: 182, protein: 34, contains: ["meat"] },
  { name: "Tuna (canned, drained)",  nameHe: "טונה (שימור, מסונן)",  portion: "90g",           calories: 104, protein: 23, contains: ["fish"] },
  { name: "2 whole eggs",            nameHe: "2 ביצים שלמות",         portion: "2 large",       calories: 144, protein: 12, contains: ["eggs"] },
  { name: "Cottage cheese",          nameHe: "קוטג׳",                portion: "200g",          calories: 144, protein: 24, contains: ["dairy"] },
  { name: "Salmon (cooked)",         nameHe: "סלמון מבושל",           portion: "90g",           calories: 187, protein: 18, contains: ["fish"] },
  { name: "Shrimp (cooked)",         nameHe: "שרימפס מבושל",          portion: "100g",          calories:  99, protein: 24, contains: ["fish","shellfish"] },
  { name: "Tempeh",                  nameHe: "טמפה",                  portion: "100g",          calories: 193, protein: 19, contains: [] },
  { name: "Lean ground beef",        nameHe: "בשר בקר טחון רזה",     portion: "100g cooked",   calories: 152, protein: 26, contains: ["meat"] },
];

const PROTEIN_MAIN: FoodOption[] = [
  { name: "Chicken breast (cooked)", nameHe: "חזה עוף מבושל",        portion: "180g",          calories: 297, protein: 56, contains: ["meat"] },
  { name: "Salmon (cooked)",         nameHe: "סלמון מבושל",           portion: "150g",          calories: 312, protein: 30, contains: ["fish"] },
  { name: "Lean ground beef",        nameHe: "בשר בקר טחון רזה",     portion: "150g cooked",   calories: 228, protein: 39, contains: ["meat"] },
  { name: "Turkey breast (cooked)",  nameHe: "חזה הודו מבושל",        portion: "180g",          calories: 198, protein: 41, contains: ["meat"] },
  { name: "Tuna steak (cooked)",     nameHe: "סטייק טונה מבושל",      portion: "180g",          calories: 209, protein: 47, contains: ["fish"] },
  { name: "Firm tofu (pan-fried)",   nameHe: "טופו קשה מוקפץ",        portion: "200g",          calories: 196, protein: 20, contains: [] },
  { name: "Chicken thigh (no skin)", nameHe: "ירך עוף ללא עור",       portion: "150g cooked",   calories: 239, protein: 34, contains: ["meat"] },
];

// ─── Carb options ─────────────────────────────────────────────────────────────

const CARB_SNACK: FoodOption[] = [
  { name: "Rice cake",               nameHe: "עוגת אורז",            portion: "1 piece",    calories:  35, protein:  1, contains: [] },
  { name: "Apple or pear",           nameHe: "תפוח או אגס",           portion: "1 medium",   calories:  78, protein:  0, contains: [] },
  { name: "Banana (small)",          nameHe: "בננה קטנה",             portion: "80g",        calories:  71, protein:  1, contains: [] },
  { name: "Berries",                 nameHe: "פירות יער",              portion: "1 cup 120g", calories:  50, protein:  1, contains: [] },
  { name: "Small tortilla",          nameHe: "טורטייה קטנה",          portion: "30g",        calories:  75, protein:  2, contains: ["gluten"] },
  { name: "Oat bar (low sugar)",     nameHe: "חטיף שיבולת שועל",      portion: "30g",        calories: 120, protein:  3, contains: [] },
];

const CARB_SMALL: FoodOption[] = [
  { name: "White rice (cooked)",     nameHe: "אורז לבן מבושל",        portion: "100g",       calories: 130, protein:  3, contains: [] },
  { name: "Oats (cooked)",           nameHe: "שיבולת שועל מבושלת",    portion: "200g",       calories:  70, protein:  2, contains: [] },
  { name: "Medium tortilla",         nameHe: "טורטייה בינונית",        portion: "50g",        calories: 125, protein:  3, contains: ["gluten"] },
  { name: "Whole wheat bread",       nameHe: "לחם מחיטה מלאה",        portion: "2 slices",   calories: 138, protein:  6, contains: ["gluten"] },
  { name: "Pasta (cooked)",          nameHe: "פסטה מבושלת",            portion: "100g",       calories: 158, protein:  6, contains: ["gluten"] },
  { name: "Sweet potato (baked)",    nameHe: "בטטה אפויה",             portion: "100g",       calories:  86, protein:  2, contains: [],
    warning: "Starchy — measure this", warningHe: "עמילני — מדוד בקפידה" },
  { name: "Pita bread",              nameHe: "פיתה",                   portion: "60g",        calories: 165, protein:  5, contains: ["gluten"] },
];

const CARB_MAIN: FoodOption[] = [
  { name: "White rice (cooked)",     nameHe: "אורז לבן מבושל",        portion: "180g",       calories: 234, protein:  5, contains: [] },
  { name: "Brown rice (cooked)",     nameHe: "אורז מלא מבושל",         portion: "180g",       calories: 216, protein:  5, contains: [] },
  { name: "Pasta (cooked)",          nameHe: "פסטה מבושלת",            portion: "160g",       calories: 253, protein: 10, contains: ["gluten"] },
  { name: "Large tortilla",          nameHe: "טורטייה גדולה",           portion: "70g",        calories: 175, protein:  5, contains: ["gluten"] },
  { name: "Baked potato",            nameHe: "תפוח אדמה אפוי",         portion: "150g",       calories: 130, protein:  3, contains: [],
    warning: "Starchy — measure this", warningHe: "עמילני — מדוד בקפידה" },
  { name: "Sweet potato (baked)",    nameHe: "בטטה אפויה",             portion: "150g",       calories: 129, protein:  3, contains: [],
    warning: "Starchy — measure this", warningHe: "עמילני — מדוד בקפידה" },
  { name: "Pita + rice combo",       nameHe: "פיתה + אורז",            portion: "50g pita + 100g rice", calories: 212, protein: 6, contains: ["gluten"] },
];

// ─── Veggie options (shared across all tiers) ─────────────────────────────────

export const VEGGIE_OPTIONS: FoodOption[] = [
  { name: "Cucumber",            nameHe: "מלפפון",          portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Lettuce / greens",    nameHe: "חסה / ירוקים",    portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Spinach",             nameHe: "תרד",              portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Cabbage (raw)",       nameHe: "כרוב חי",          portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Celery",              nameHe: "סלרי",             portion: "unlimited",  calories:  0, protein: 0, contains: [] },
  { name: "Bell pepper",         nameHe: "פלפל",             portion: "1 medium",   calories: 31, protein: 1, contains: [] },
  { name: "Tomato",              nameHe: "עגבנייה",           portion: "1 medium",   calories: 22, protein: 1, contains: [] },
  { name: "Broccoli (cooked)",   nameHe: "ברוקולי מבושל",    portion: "100g",       calories: 55, protein: 4, contains: [] },
  { name: "Zucchini (cooked)",   nameHe: "קישוא מבושל",      portion: "100g",       calories: 17, protein: 1, contains: [] },
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

export const WARNING_FOODS: Array<{
  name: string; nameHe: string;
  note: string; noteHe: string;
}> = [
  { name: "Avocado",       nameHe: "אבוקדו",       note: "½ avocado ≈ 120 cal",           noteHe: "½ אבוקדו ≈ 120 קל׳" },
  { name: "Corn",          nameHe: "תירס",          note: "Starchy — measure this",         noteHe: "עמילני — מדוד בקפידה" },
  { name: "Olives",        nameHe: "זיתים",         note: "Higher calorie — count them",    noteHe: "קלורי — ספור אותם" },
  { name: "Potatoes",      nameHe: "תפוחי אדמה",    note: "Starchy — measure this",         noteHe: "עמילני — מדוד בקפידה" },
  { name: "Sweet potato",  nameHe: "בטטה",          note: "Starchy — measure this",         noteHe: "עמילני — מדוד בקפידה" },
  { name: "Tahini",        nameHe: "טחינה",         note: "1 tbsp ≈ 90 cal",               noteHe: "כף ≈ 90 קל׳" },
  { name: "Olive oil",     nameHe: "שמן זית",       note: "1 tbsp ≈ 120 cal",              noteHe: "כף ≈ 120 קל׳" },
  { name: "Nuts",          nameHe: "אגוזים",        note: "30g ≈ 175 cal",                 noteHe: "30 גרם ≈ 175 קל׳" },
  { name: "Peanut butter", nameHe: "חמאת בוטנים",   note: "2 tbsp ≈ 190 cal",              noteHe: "2 כפות ≈ 190 קל׳" },
  { name: "Hummus",        nameHe: "חומוס",         note: "50g ≈ 90 cal",                  noteHe: "50 גרם ≈ 90 קל׳" },
  { name: "Dates",         nameHe: "תמרים",         note: "Easy to overeat — count them",   noteHe: "קל לאכול יותר מדי — ספור אותם" },
  { name: "Granola",       nameHe: "גרנולה",        note: "30g ≈ 130 cal",                 noteHe: "30 גרם ≈ 130 קל׳" },
];

// ─── Sauces guide ─────────────────────────────────────────────────────────────

export const SAUCES_FREE: SauceItem[] = [
  { name: "Salt & pepper",               nameHe: "מלח ופלפל" },
  { name: "Garlic powder",               nameHe: "אבקת שום" },
  { name: "Paprika",                     nameHe: "פפריקה" },
  { name: "Chili flakes",               nameHe: "פתיתי צ׳ילי" },
  { name: "Hot sauce (~5 cal/tsp)",      nameHe: "רוטב חריף (~5 קל׳/כפית)" },
  { name: "Mustard (~15 cal/tbsp)",      nameHe: "חרדל (~15 קל׳/כף)" },
  { name: "Lemon juice (~4 cal/tbsp)",   nameHe: "מיץ לימון (~4 קל׳/כף)" },
  { name: "Vinegar (~3 cal/tbsp)",       nameHe: "חומץ (~3 קל׳/כף)" },
  { name: "Low-cal ketchup (~10 cal/tbsp)", nameHe: "קטשופ דל קלוריות (~10 קל׳/כף)" },
];

export const SAUCES_CAREFUL: SauceItem[] = [
  { name: "Regular ketchup (~20 cal/tbsp)",       nameHe: "קטשופ רגיל (~20 קל׳/כף)" },
  { name: "Mayo (~100 cal/tbsp)",                 nameHe: "מיונז (~100 קל׳/כף)" },
  { name: "BBQ sauce (~40 cal/2 tbsp)",           nameHe: "רוטב BBQ (~40 קל׳/2 כפות)" },
  { name: "Sweet chili sauce (~35 cal/tbsp)",     nameHe: "רוטב צ׳ילי מתוק (~35 קל׳/כף)" },
  { name: "Tahini (~90 cal/tbsp)",               nameHe: "טחינה (~90 קל׳/כף)" },
  { name: "Olive oil (~120 cal/tbsp)",            nameHe: "שמן זית (~120 קל׳/כף)" },
  { name: "Salad dressing (~80–150 cal/2 tbsp)", nameHe: "רוטב סלט (~80–150 קל׳/2 כפות)" },
];
