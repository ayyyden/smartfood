import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname === "/auth") {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return supabaseResponse;
  }

  // Callback exchanges the email-confirmation code for a session — always public
  if (pathname === "/auth/callback") {
    return supabaseResponse;
  }

  if (pathname === "/onboarding") {
    if (!user) return NextResponse.redirect(new URL("/auth", request.url));
    return supabaseResponse;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Only run on app routes — skip Next.js internals, API routes, and any
  // public static file (by extension or well-known filename).
  matcher: [
    "/((?!_next/static|_next/image|api/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif|css|js|json|txt|xml|woff2?|ttf|otf|map)).+)",
  ],
};
