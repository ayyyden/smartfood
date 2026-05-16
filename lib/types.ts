export type NutritionSource = "usda" | "ai" | "mock" | "manual";

export type FoodItem = {
  name: string;
  amount: string;        // human-readable (e.g. "150g", "2 eggs")
  grams: number | null;  // weight in grams for USDA lookup; null if unknown
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: NutritionSource; // set after enrichment; absent on pre-enrichment AI items
};

export type ParseFoodResponse = {
  originalText: string;
  items: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
  needsFollowUp: boolean;
  followUpQuestion: string | null;
  optionalTip: string | null;
};

export type ParseFoodError = {
  error: string;
  fallback: true;
};
