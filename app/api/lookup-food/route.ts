import { NextRequest, NextResponse } from "next/server";
import { usdaSearch, type USDAMatch, type USDADebugEntry } from "@/lib/usdaLookup";

export type LookupMatch = USDAMatch;

export type LookupResult =
  | { found: true;  matches: LookupMatch[] }
  | { found: false };

export async function GET(req: NextRequest) {
  // ?q= triggers debug mode and returns full diagnostic JSON.
  // ?name= is the normal production path used by the UI.
  const debugInput = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const prodInput  = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const isDebug    = debugInput !== "";
  const input      = debugInput || prodInput;

  const usdaKeySet = !!process.env.USDA_API_KEY;
  const usdaKey    = process.env.USDA_API_KEY ?? "DEMO_KEY";

  console.log(`[lookup-food] input="${input}" debug=${isDebug} keySet=${usdaKeySet}`);

  if (!input) {
    if (isDebug) {
      return NextResponse.json({ error: "provide ?q=food+name" });
    }
    return NextResponse.json({ found: false } satisfies LookupResult);
  }

  const dbg: USDADebugEntry[] = [];
  const matches = await usdaSearch(input, usdaKey, 10, dbg);

  // ── Debug response ──────────────────────────────────────────────────────────
  if (isDebug) {
    return NextResponse.json({
      input,
      usdaKeyLoaded: usdaKeySet,
      usdaKeyUsed:   usdaKeySet ? `...${usdaKey.slice(-4)}` : "DEMO_KEY",
      matchCount:    matches.length,
      firstMatches:  matches.slice(0, 3).map((m) => `${m.description} (${m.cal100} cal)`),
      queriesTried:  dbg,
      matches,
    });
  }

  // ── Production response ─────────────────────────────────────────────────────
  if (matches.length === 0) {
    return NextResponse.json({ found: false } satisfies LookupResult);
  }

  return NextResponse.json({ found: true, matches } satisfies LookupResult);
}
