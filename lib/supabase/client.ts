import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NODE_ENV === "development") {
    console.log("[Supabase] URL present:", !!url);
    console.log("[Supabase] Anon key present:", !!key);
  }

  if (!url || !key) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  return createBrowserClient(url, key);
}
