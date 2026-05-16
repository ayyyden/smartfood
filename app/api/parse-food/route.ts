import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ParseFoodResponse, FoodItem, ParseFoodError } from "@/lib/types";
import { validateAndSanitize } from "@/lib/validateNutrition";
import { usdaLookup } from "@/lib/usdaLookup";

// ---------------------------------------------------------------------------
// System prompt — OpenAI extracts food items + gram weights (AI estimates used
// only as fallback when USDA lookup fails for an item).
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a food parser for a calorie tracking app. Your job is to extract food items and their quantities from natural language. The app will look up accurate nutrition from USDA — your calorie/macro numbers are estimates used only as a fallback.

HARD CONSTRAINTS — your estimates must obey physical limits:
- Single meal max: 5000 cal, 300g protein, 800g carbs, 300g fat.
- Per 100g: pure fat ≈ 900 cal, pure protein ≈ 400 cal, pure carbs ≈ 400 cal.
- Typical home-cooked meal: 300–900 calories.
- Never return impossible values like 99999 or 4.99e11.

Nutrition estimates (per 100g unless noted):
- white rice (cooked): 130 cal, 2.7g P, 28g C, 0.3g F
- chicken breast (cooked): 165 cal, 31g P, 0g C, 3.6g F
- chicken thigh (cooked): 209 cal, 26g P, 0g C, 11g F
- salmon (cooked): 208 cal, 20g P, 0g C, 13g F
- tuna (canned): 116 cal, 26g P, 0g C, 1g F
- egg (1 large = 50g): 72 cal, 6g P, 0.4g C, 5g F
- mixed vegetables (cooked): 65 cal, 3g P, 13g C, 0.4g F
- broccoli (cooked): 55 cal, 3.7g P, 11g C, 0.6g F
- white bread (1 slice = 28g): 79 cal, 2.7g P, 15g C, 1g F
- oats (dry): 389 cal, 17g P, 66g C, 7g F
- pasta (cooked): 158 cal, 5.8g P, 31g C, 0.9g F
- ground beef (cooked): 254 cal, 26g P, 0g C, 17g F
- banana (1 medium = 118g): 105 cal, 1.3g P, 27g C, 0.4g F
- apple (1 medium = 182g): 95 cal, 0.5g P, 25g C, 0.3g F
- Greek yogurt (plain): 59 cal, 10g P, 3.6g C, 0.4g F
- almonds: 579 cal, 21g P, 22g C, 50g F
- olive oil (1 tbsp = 14g): 119 cal, 0g P, 0g C, 14g F
- cheese (cheddar): 402 cal, 25g P, 1.3g C, 33g F

Cooking assumptions (apply when user doesn't specify):
- "rice" → cooked white rice
- "chicken breast" or "chicken thigh" → cooked, no skin
- "pasta" or "noodles" → cooked
- "vegetables" with no type → mixed cooked vegetables
- Fruits → raw (apple, banana, etc.)
- Oats → dry weight unless "cooked oatmeal" specified

Rules:
1. Return ONLY valid JSON — no markdown, no code fences, no explanation.
2. A quantity is "known" ONLY when the user provides: grams (g), ounces (oz), cups, ml, a specific count ("2 eggs", "1 apple"), or a clearly named serving ("1 medium banana", "1 slice bread").
3. Set needsFollowUp: true whenever ANY significant food item has vague or missing quantity. Vague language: "some", "a bit of", "a little", "a few", "a handful", "a portion", "some vegetables". Do NOT estimate vague quantities — always ask.
4. Never ask about oil, sauces, or condiments — treat those as optional.
5. followUpQuestion must start with "Got it! " and ask exactly ONE clarifying question.
6. optionalTip: mention oil/sauce only if it would meaningfully change the result (e.g. stir-fry). Otherwise null.
7. For each item include "grams" — the weight in grams. Convert: 1 large egg ≈ 50g, 1 slice bread ≈ 28g, 1 cup cooked rice ≈ 186g, 1 tbsp ≈ 15g, 1 medium apple ≈ 182g, 1 medium banana ≈ 118g, 1 medium chicken breast ≈ 170g. Set null if weight cannot be determined.
8. The "name" field must be a clean English food name for database lookup (e.g. "white rice", "chicken breast", "broccoli", "mixed vegetables", "apple").
9. Sum all items for top-level calories/protein/carbs/fat.
10. Examples: "150g rice, 150g chicken, some vegetables" → needsFollowUp: true. "2 eggs and some toast" → needsFollowUp: true (ask slices). "250g rice, 200g chicken breast" → needsFollowUp: false.

Return this exact shape:
{
  "originalText": string,
  "items": [{ "name": string, "amount": string, "grams": number | null, "calories": number, "protein": number, "carbs": number, "fat": number }],
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high" | "medium" | "low",
  "needsFollowUp": boolean,
  "followUpQuestion": string | null,
  "optionalTip": string | null
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Replace each item's nutrition with USDA values and tag the source. */
async function enrichWithUSDA(
  items: FoodItem[],
  usdaKey: string,
): Promise<FoodItem[]> {
  return Promise.all(
    items.map(async (item): Promise<FoodItem> => {
      if (typeof item.grams !== "number" || item.grams <= 0) {
        return { ...item, source: "ai" };
      }

      const result = await usdaLookup(item.name, item.grams, usdaKey);
      if (!result) return { ...item, source: "ai" };

      return {
        ...item,
        calories: result.values.calories,
        protein:  result.values.protein,
        carbs:    result.values.carbs,
        fat:      result.values.fat,
        source:   "usda",
      };
    }),
  );
}

function sumItems(items: FoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein:  acc.protein  + item.protein,
      carbs:    acc.carbs    + item.carbs,
      fat:      acc.fat      + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ── 1. OpenAI key (required) ──
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error("[parse-food] OPENAI_API_KEY not set — falling back to mock parser");
    const err: ParseFoodError = {
      error: "OPENAI_API_KEY is not set. Add it to .env.local.",
      fallback: true,
    };
    return NextResponse.json(err, { status: 503 });
  }

  // ── 2. USDA key (optional — DEMO_KEY used if absent, rate-limited) ──
  const usdaKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
  if (!process.env.USDA_API_KEY) {
    console.warn("[parse-food] USDA_API_KEY not set — using DEMO_KEY (30 req/hr limit)");
  }

  // ── 3. Parse request body ──
  let body: { text: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", fallback: true }, { status: 400 });
  }

  const { text, context } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required", fallback: true }, { status: 400 });
  }

  const userMessage = context
    ? `Original meal: "${context}"\nFollow-up answer: "${text}"\n\nParse the complete meal with the follow-up detail. Set needsFollowUp: false.`
    : text;

  // ── 4. Call OpenAI ──
  let parsed: ParseFoodResponse;
  try {
    const client = new OpenAI({ apiKey: openaiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    const raw = completion.choices[0].message.content ?? "";
    parsed = JSON.parse(raw) as ParseFoodResponse;
  } catch (err) {
    console.error("[parse-food] OpenAI call failed:", err);
    return NextResponse.json({ error: "AI parsing failed", fallback: true }, { status: 500 });
  }

  // ── 5. If AI needs a follow-up, return the question immediately (no USDA) ──
  if (parsed.needsFollowUp && parsed.followUpQuestion) {
    return NextResponse.json(parsed);
  }

  // ── 6. All info is available — enrich each item with USDA nutrition ──
  const enrichedItems = await enrichWithUSDA(parsed.items, usdaKey);
  const totals = sumItems(enrichedItems);

  // ── 7. Validate final totals ──
  const validation = validateAndSanitize(totals);
  if (!validation.ok) {
    console.warn(`[parse-food] Final totals failed validation: ${validation.reason}`);
    return NextResponse.json({ error: validation.reason, fallback: true }, { status: 422 });
  }

  const response: ParseFoodResponse = {
    ...parsed,
    items: enrichedItems,
    ...validation.values,
  };

  return NextResponse.json(response);
}
