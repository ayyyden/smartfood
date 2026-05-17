import { NextRequest, NextResponse } from "next/server";
import { usdaSearch, type USDAMatch } from "@/lib/usdaLookup";

export type LookupMatch = USDAMatch;

export type LookupResult =
  | { found: true;  matches: LookupMatch[] }
  | { found: false };

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ found: false } satisfies LookupResult);

  const usdaKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
  const matches = await usdaSearch(name, usdaKey, 10);

  if (matches.length === 0) {
    return NextResponse.json({ found: false } satisfies LookupResult);
  }

  return NextResponse.json({ found: true, matches } satisfies LookupResult);
}
