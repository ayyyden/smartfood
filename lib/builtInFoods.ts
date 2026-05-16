// Static built-in food database.
// All meat/chicken/fish values are cooked unless noted.
// Macros are per the listed serving. Stored as integers (rounded).

import type { ServingUnit } from "@/lib/proFoods";

export type BuiltInFood = {
  id:              string;
  name:            string;
  category:        string;
  servingAmount:   number;
  servingUnit:     ServingUnit;
  gramsPerServing: number;
  calories:        number;
  protein:         number;
  carbs:           number;
  fat:             number;
  source:          "built_in";
  warning?:        string;
};

export const BUILT_IN_CATEGORIES = [
  "Chicken",
  "Meat",
  "Fish",
  "Eggs & Dairy",
  "Carbs",
  "Vegetables",
] as const;

export const BUILT_IN_FOODS: BuiltInFood[] = [
  // ── Chicken ─────────────────────────────────────────────────────────────────
  {
    id: "bi_chicken_breast_skinless",
    name: "Chicken breast, cooked, skinless",
    category: "Chicken",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 165, protein: 31, carbs: 0, fat: 4,
    source: "built_in",
  },
  {
    id: "bi_chicken_thigh_skinless",
    name: "Chicken thigh, cooked, skinless",
    category: "Chicken",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 179, protein: 28, carbs: 0, fat: 7,
    source: "built_in",
  },
  {
    id: "bi_chicken_thigh_skin",
    name: "Chicken thigh, cooked, with skin",
    category: "Chicken",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 229, protein: 25, carbs: 0, fat: 14,
    source: "built_in",
  },
  {
    id: "bi_chicken_drumstick_skin",
    name: "Chicken drumstick, cooked, with skin",
    category: "Chicken",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 216, protein: 27, carbs: 0, fat: 11,
    source: "built_in",
  },
  {
    id: "bi_chicken_drumstick_skinless",
    name: "Chicken drumstick, cooked, skinless",
    category: "Chicken",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 172, protein: 28, carbs: 0, fat: 6,
    source: "built_in",
  },

  // ── Meat ────────────────────────────────────────────────────────────────────
  {
    id: "bi_beef_9010",
    name: "Lean ground beef 90/10, cooked",
    category: "Meat",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 218, protein: 26, carbs: 0, fat: 12,
    source: "built_in",
  },
  {
    id: "bi_beef_8020",
    name: "Ground beef 80/20, cooked",
    category: "Meat",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 254, protein: 24, carbs: 0, fat: 17,
    source: "built_in",
  },
  {
    id: "bi_steak",
    name: "Steak, cooked",
    category: "Meat",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 207, protein: 27, carbs: 0, fat: 10,
    source: "built_in",
  },
  {
    id: "bi_turkey_breast",
    name: "Turkey breast, cooked",
    category: "Meat",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 135, protein: 30, carbs: 0, fat: 1,
    source: "built_in",
  },
  {
    id: "bi_turkey_thigh",
    name: "Turkey thigh, cooked",
    category: "Meat",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 185, protein: 27, carbs: 0, fat: 8,
    source: "built_in",
  },

  // ── Fish ─────────────────────────────────────────────────────────────────────
  {
    id: "bi_salmon",
    name: "Salmon, cooked",
    category: "Fish",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 208, protein: 20, carbs: 0, fat: 13,
    source: "built_in",
  },
  {
    id: "bi_tuna",
    name: "Tuna, cooked",
    category: "Fish",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 184, protein: 30, carbs: 0, fat: 6,
    source: "built_in",
  },
  {
    id: "bi_white_fish",
    name: "White fish, cooked",
    category: "Fish",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 105, protein: 23, carbs: 0, fat: 1,
    source: "built_in",
  },
  {
    id: "bi_tilapia",
    name: "Tilapia, cooked",
    category: "Fish",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 128, protein: 26, carbs: 0, fat: 3,
    source: "built_in",
  },

  // ── Eggs & Dairy ─────────────────────────────────────────────────────────────
  {
    id: "bi_whole_egg",
    name: "Whole egg, large",
    category: "Eggs & Dairy",
    servingAmount: 1, servingUnit: "piece", gramsPerServing: 50,
    calories: 72, protein: 6, carbs: 0, fat: 5,
    source: "built_in",
  },
  {
    id: "bi_egg_whites",
    name: "Egg whites",
    category: "Eggs & Dairy",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 52, protein: 11, carbs: 1, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_greek_yogurt",
    name: "Greek yogurt, plain",
    category: "Eggs & Dairy",
    servingAmount: 170, servingUnit: "g", gramsPerServing: 170,
    calories: 100, protein: 17, carbs: 6, fat: 1,
    source: "built_in",
  },
  {
    id: "bi_cottage_cheese",
    name: "Cottage cheese",
    category: "Eggs & Dairy",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 98, protein: 11, carbs: 3, fat: 4,
    source: "built_in",
  },

  // ── Carbs ────────────────────────────────────────────────────────────────────
  {
    id: "bi_white_rice",
    name: "White rice, cooked",
    category: "Carbs",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 130, protein: 3, carbs: 28, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_pasta",
    name: "Pasta, cooked",
    category: "Carbs",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 131, protein: 5, carbs: 25, fat: 1,
    source: "built_in",
  },
  {
    id: "bi_potato_baked",
    name: "Potato, baked",
    category: "Carbs",
    servingAmount: 150, servingUnit: "g", gramsPerServing: 150,
    calories: 140, protein: 4, carbs: 32, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_sweet_potato",
    name: "Sweet potato, baked",
    category: "Carbs",
    servingAmount: 150, servingUnit: "g", gramsPerServing: 150,
    calories: 135, protein: 3, carbs: 32, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_bread_slice",
    name: "Bread slice, white",
    category: "Carbs",
    servingAmount: 1, servingUnit: "slice", gramsPerServing: 30,
    calories: 79, protein: 3, carbs: 15, fat: 1,
    source: "built_in",
  },
  {
    id: "bi_tortilla",
    name: "Tortilla, flour medium",
    category: "Carbs",
    servingAmount: 1, servingUnit: "piece", gramsPerServing: 45,
    calories: 146, protein: 4, carbs: 25, fat: 3,
    source: "built_in",
  },

  // ── Vegetables ───────────────────────────────────────────────────────────────
  {
    id: "bi_broccoli",
    name: "Broccoli",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 34, protein: 3, carbs: 7, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_cucumber",
    name: "Cucumber",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 15, protein: 1, carbs: 4, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_lettuce",
    name: "Lettuce",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 15, protein: 1, carbs: 3, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_bell_pepper",
    name: "Bell pepper",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 31, protein: 1, carbs: 6, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_onion",
    name: "Onion",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 40, protein: 1, carbs: 9, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_mushrooms",
    name: "Mushrooms",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 22, protein: 3, carbs: 3, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_tomato",
    name: "Tomato",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 18, protein: 1, carbs: 4, fat: 0,
    source: "built_in",
  },
  {
    id: "bi_zucchini",
    name: "Zucchini",
    category: "Vegetables",
    servingAmount: 100, servingUnit: "g", gramsPerServing: 100,
    calories: 17, protein: 1, carbs: 3, fat: 0,
    source: "built_in",
  },
];
