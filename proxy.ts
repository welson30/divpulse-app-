import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/holdings",
  "/dividends",
  "/calendar",
  "/collections",
  "/diversification",
  "/watchlist",
  "/goals",
  "/notifications",
  "/settings",
];

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated visitors away from (dashboard) routes to /login, per
 * ARCHITECTURE.md §10. Runs before every matched route — see `config`
 * below for what's excluded (static assets, PWA metadata files).
 *
 * Named proxy.ts (not middleware.ts) — Next.js 16 renamed the
 * "middleware" file convention to "proxy"; middleware.ts still works but
 * is deprecated (see node_modules/next/dist/docs/.../file-conventions/proxy.md).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
