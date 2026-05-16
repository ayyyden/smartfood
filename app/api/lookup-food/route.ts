import { NextRequest, NextResponse } from "next/server";
import { usdaLookup } from "@/lib/usdaLookup";

export type LookupResult =
  | { found: true;  label: string; cal100: number; protein100: number }
  | { found: false };

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ found: false } satisfies LookupResult);

  const usdaKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
  // Pass 100g → factor=1 → result.values are already per-100g
  const result = await usdaLookup(name, 100, usdaKey);

  if (!result) return NextResponse.json({ found: false } satisfies LookupResult);

  return NextResponse.json({
    found:      true,
    label:      result.source,
    cal100:     Math.round(result.values.calories),
    protein100: Math.round(result.values.protein),
  } satisfies LookupResult);
}
