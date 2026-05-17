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
  "chicken wings":      "chicken wing meat and skin cooked roasted",
  "chicken wing":       "chicken wing meat and skin cooked roasted",
  "wings":              "chicken wing meat and skin cooked roasted",
  "chicken drumstick":  "chicken drumstick meat and skin cooked roasted",
  "chicken drumsticks": "chicken drumstick meat and skin cooked roasted",
  "chicken legs":       "chicken leg meat and skin cooked roasted",
  "chicken leg":        "chicken leg meat and skin cooked roasted",
  "white rice":         "rice white long-grain cooked",
  "brown rice":         "rice brown long-grain cooked",
  "rice":               "rice white long-grain cooked",
  "pasta":              "pasta cooked",
  "steak":              "beef steak cooked",
  "ground beef":        "beef ground cooked",
  "beef":               "beef ground cooked",
  "salmon":             "salmon cooked dry heat",
  "tuna":               "tuna canned water",
  "tilapia":            "fish tilapia cooked dry heat",
  "shrimp":             "shrimp cooked moist heat",
  "cod":                "fish cod cooked dry heat",
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
  // Only calories is required. Protein/carbs/fat default to 0 when USDA omits them
  // (e.g. pure-meat entries often have no carbs row — 0 is correct for chicken wings).
  if (calories === null) return null;
  return {
    calories,
    protein: find(NID.protein) ?? 0,
    carbs:   find(NID.carbs)   ?? 0,
    fat:     find(NID.fat)     ?? 0,
  };
}

// ─── Multi-result search (used by /api/lookup-food for the Food Menu) ────────

export type USDAMatch = {
  fdcId:       number;
  description: string;
  dataType:    string;
  cal100:      number;
  protein100:  number;
  carbs100:    number;
  fat100:      number;
};

// Debug entry collected per-query — returned in the ?q= debug response
export type USDADebugEntry = {
  query:         string;
  dataType:      string;
  usdaStatus:    number | "timeout" | "error" | "not_called";
  totalHits:     number;
  rawCount:      number;
  parsedCount:   number;
  filterDropped: number;
  sampleRaw:     string[];
};

// Build a ranked list of USDA query strings to try in sequence.
// Uses the alias (most specific) first, then progressively simpler fallbacks.
function buildQueryChain(rawName: string): string[] {
  const lower = rawName.toLowerCase().trim();
  const seen  = new Set<string>();
  const out:  string[] = [];

  function add(q: string) {
    const t = q.trim();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }

  // 1. Exact alias (most targeted)
  if (ALIASES[lower]) add(ALIASES[lower]);

  // 2. Longest partial alias
  const partialKey = Object.keys(ALIASES)
    .filter((k) => lower.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  if (partialKey) add(ALIASES[partialKey]);

  // 3. Original user input
  add(lower);

  // 4. Singular form — "chicken wings" → "chicken wing"
  if (lower.endsWith("s") && lower.length > 4) add(lower.slice(0, -1));

  // 5. First two words — shorter, broader match for USDA full-text search
  const words = lower.split(/\s+/);
  if (words.length > 1) add(words.slice(0, 2).join(" "));

  return out.slice(0, 5);
}

// Execute a single USDA /foods/search request; populates dbg entry if provided.
async function fetchOneQuery(
  query:    string,
  apiKey:   string,
  pageSize: number,
  dataType  = "Foundation,SR Legacy",
  dbg?:     USDADebugEntry[],
): Promise<USDAMatch[]> {
  const entry: USDADebugEntry = {
    query, dataType,
    usdaStatus: "not_called", totalHits: 0,
    rawCount: 0, parsedCount: 0, filterDropped: 0, sampleRaw: [],
  };

  const params = new URLSearchParams({
    query,
    api_key:   apiKey,
    dataType,
    pageSize:  String(pageSize),
    nutrients: `${NID.calories},${NID.protein},${NID.fat},${NID.carbs}`,
  });

  try {
    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    entry.usdaStatus = res.status;

    if (!res.ok) {
      console.warn(`[usda] HTTP ${res.status} for query="${query}" dataType="${dataType}"`);
      dbg?.push(entry);
      return [];
    }

    const data = await res.json() as { foods?: USDASearchFood[]; totalHits?: number };
    entry.totalHits = data.totalHits ?? 0;
    const foods = data.foods ?? [];
    entry.rawCount  = foods.length;
    entry.sampleRaw = foods.slice(0, 3).map((f) => f.description);

    console.info(
      `[usda] query="${query}" status=${res.status} totalHits=${entry.totalHits} raw=${foods.length}`,
    );
    if (entry.sampleRaw.length) {
      console.info(`[usda]   sample: ${entry.sampleRaw.join(" | ")}`);
    }

    const out: USDAMatch[] = [];
    for (const food of foods) {
      const per100g = extractPer100g(food.foodNutrients);
      if (!per100g) { entry.filterDropped++; continue; }
      out.push({
        fdcId:       food.fdcId,
        description: food.description,
        dataType:    food.dataType,
        cal100:      Math.round(per100g.calories),
        protein100:  Math.round(per100g.protein),
        carbs100:    Math.round(per100g.carbs),
        fat100:      Math.round(per100g.fat),
      });
    }
    entry.parsedCount = out.length;
    if (entry.filterDropped > 0) {
      console.info(`[usda]   filterDropped=${entry.filterDropped} (missing calories nutrient)`);
    }

    dbg?.push(entry);
    return out;
  } catch (err) {
    const isTimeout = String(err).toLowerCase().includes("timeout");
    entry.usdaStatus = isTimeout ? "timeout" : "error";
    console.warn(`[usda] fetch error for query="${query}":`, String(err));
    dbg?.push(entry);
    return [];
  }
}

// Search USDA with a fallback chain — tries each query in order and returns
// the first non-empty batch. Falls back to broader dataType as a last resort.
export async function usdaSearch(
  foodName: string,
  apiKey:   string,
  pageSize  = 10,
  dbg?:     USDADebugEntry[],
): Promise<USDAMatch[]> {
  const queries = buildQueryChain(foodName);
  const seen    = new Set<number>();

  console.info(`[usda] search="${foodName}" chain=${JSON.stringify(queries)} key=${apiKey === "DEMO_KEY" ? "DEMO_KEY" : "***"}`);

  for (const query of queries) {
    const batch  = await fetchOneQuery(query, apiKey, pageSize, "Foundation,SR Legacy", dbg);
    const unique = batch.filter((m) => !seen.has(m.fdcId));
    if (unique.length > 0) {
      unique.forEach((m) => seen.add(m.fdcId));
      console.info(`[usda] "${foodName}" resolved via "${query}" → ${unique.length} matches`);
      return unique.slice(0, pageSize);
    }
  }

  // Last resort: widen dataType to include Survey (FNDDS)
  const broadQuery = queries.at(-1) ?? foodName.toLowerCase().trim();
  console.info(`[usda] "${foodName}" → all chain queries empty, trying broad dataType for "${broadQuery}"`);
  const broad = await fetchOneQuery(
    broadQuery, apiKey, pageSize,
    "Foundation,SR Legacy,Survey (FNDDS)",
    dbg,
  );
  if (broad.length > 0) {
    console.info(`[usda] "${foodName}" resolved via broad search → ${broad.length} matches`);
    return broad.slice(0, pageSize);
  }

  console.warn(`[usda] "${foodName}" → NO results after ${queries.length + 1} attempts`);
  return [];
}

// ─── Single-result lookup (used by Pro Mode / parse-food) ────────────────────

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
    pageSize: "10",
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
