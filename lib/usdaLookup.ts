import type { MacroValues } from "./validateNutrition";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// Nutrient IDs — stable across USDA data types
const NID = {
  calories: 1008, // Energy, kcal
  protein:  1003, // Protein, g
  fat:      1004, // Total lipid (fat), g
  carbs:    1005, // Carbohydrate, by difference, g
} as const;

// Exact-match aliases → improve USDA search accuracy for common inputs
const ALIASES: Record<string, string> = {
  "vegetables":         "mixed vegetables",
  "mixed vegetables":   "mixed vegetables",
  "veggies":            "mixed vegetables",
  "chicken breast":     "chicken breast meat cooked roasted",
  "chicken thigh":      "chicken thigh meat cooked roasted",
  "white rice":         "rice white long-grain cooked",
  "brown rice":         "rice brown long-grain cooked",
  "rice":               "rice white long-grain cooked",
  "pasta":              "pasta cooked",
  "ground beef":        "beef ground cooked",
  "beef":               "beef ground cooked",
  "salmon":             "salmon cooked dry heat",
  "tuna":               "tuna canned water",
  "greek yogurt":       "yogurt greek plain nonfat",
  "yogurt":             "yogurt plain whole milk",
  "whole milk":         "milk whole 3.25%",
  "skim milk":          "milk nonfat",
  "oats":               "oats rolled dry",
  "oatmeal":            "oatmeal cooked",
  "broccoli":           "broccoli cooked",
  "spinach":            "spinach cooked",
  "potato":             "potato baked",
  "sweet potato":       "sweet potato cooked baked",
  "bread":              "bread white commercially prepared",
  "white bread":        "bread white commercially prepared",
  "whole wheat bread":  "bread whole wheat",
  "cheddar":            "cheese cheddar",
  "cheddar cheese":     "cheese cheddar",
  "egg":                "egg whole cooked hard-boiled",
  "eggs":               "egg whole cooked hard-boiled",
  "almond":             "almonds",
  "almonds":            "almonds",
  "olive oil":          "oil olive",
  "banana":             "bananas raw",
  "apple":              "apples raw with skin",
  "orange":             "oranges raw",
  "avocado":            "avocados raw",
};

// Foods assumed cooked (not raw) when no qualifier given — appends " cooked" to the search query
const ASSUME_COOKED = [
  "chicken", "turkey", "pork", "lamb", "shrimp", "lentil",
  "bean", "chickpea", "lentils", "beans",
];

function buildQuery(rawName: string): string {
  const lower = rawName.toLowerCase().trim();

  // Exact alias match
  const exact = ALIASES[lower];
  if (exact) return exact;

  // Longest-key partial alias match
  const matched = Object.keys(ALIASES)
    .filter((k) => lower.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  if (matched) return ALIASES[matched];

  // Append "cooked" for meats/legumes if no cooking qualifier present
  if (
    !lower.includes("raw") &&
    !lower.includes("cooked") &&
    !lower.includes("canned") &&
    !lower.includes("dried")
  ) {
    for (const food of ASSUME_COOKED) {
      if (lower.includes(food)) return `${lower} cooked`;
    }
  }

  return lower;
}

type USDANutrient = {
  nutrientId: number;
  value: number;
};

type USDASearchFood = {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: USDANutrient[];
};

function extractPer100g(foodNutrients: USDANutrient[]): MacroValues | null {
  const find = (id: number) => foodNutrients.find((n) => n.nutrientId === id)?.value ?? null;

  const calories = find(NID.calories);
  const protein  = find(NID.protein);
  const carbs    = find(NID.carbs);
  const fat      = find(NID.fat);

  if (calories === null || protein === null || carbs === null || fat === null) return null;
  return { calories, protein, carbs, fat };
}

/**
 * Look up nutrition for a food item from USDA FoodData Central.
 * Returns macros scaled to the provided gram weight, or null on failure.
 * Values are per-100g from Foundation and SR Legacy data types.
 */
export async function usdaLookup(
  foodName: string,
  grams: number,
  apiKey: string,
): Promise<{ values: MacroValues; source: string } | null> {
  if (grams <= 0) return null;

  const query = buildQuery(foodName);

  const params = new URLSearchParams({
    query,
    api_key: apiKey,
    dataType: "Foundation,SR Legacy",
    pageSize: "5",
    nutrients: `${NID.calories},${NID.protein},${NID.fat},${NID.carbs}`,
  });

  let foods: USDASearchFood[];
  try {
    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[usda] Search HTTP ${res.status} for "${foodName}" (query: "${query}")`);
      return null;
    }
    const data = await res.json() as { foods?: USDASearchFood[] };
    foods = data.foods ?? [];
  } catch (err) {
    console.warn(`[usda] Network error for "${foodName}":`, err);
    return null;
  }

  if (!foods.length) {
    console.warn(`[usda] No results for "${foodName}" (query: "${query}")`);
    return null;
  }

  // Walk results until one has all 4 nutrients
  for (const food of foods) {
    const per100g = extractPer100g(food.foodNutrients);
    if (!per100g) continue;

    const factor = grams / 100;
    const values: MacroValues = {
      calories: per100g.calories * factor,
      protein:  per100g.protein  * factor,
      carbs:    per100g.carbs    * factor,
      fat:      per100g.fat      * factor,
    };

    console.info(`[usda] "${foodName}" ${grams}g → ${food.description} (${food.dataType})`);
    return { values, source: food.description };
  }

  console.warn(`[usda] Results found but no nutrient data for "${foodName}"`);
  return null;
}
