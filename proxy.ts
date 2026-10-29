import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCALE_COOKIE = "PAIDPRIME_LOCALE";
const SUPPORTED_LOCALES = ["en", "pt"];

function detectLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0]!.trim().toLowerCase())
    .find((lang) => SUPPORTED_LOCALES.some((loc) => lang === loc || lang.startsWith(loc + "-")));
  return preferred?.startsWith("pt") ? "pt" : "en";
}

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/holdings",
  "/dividends",
  "/calendar",
  "/upcoming",
  "/history",
  "/collections",
  "/analytics",
  "/performance",
  "/diversification",
  "/watchlist",
  "/goals",
  "/advisor",
  "/brokers",
  "/notifications",
  "/alert-templates",
  "/settings",
  "/help",
  "/tickers",
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

  // Set locale cookie on first visit (locale detection from Accept-Language)
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!existingLocale || !SUPPORTED_LOCALES.includes(existingLocale)) {
    const detected = detectLocale(request);
    response.cookies.set(LOCALE_COOKIE, detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
