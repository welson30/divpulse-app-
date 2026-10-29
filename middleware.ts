import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "PAIDPRIME_LOCALE";
const SUPPORTED_LOCALES = ["en", "pt"];

/**
 * Detect browser language preference from Accept-Language header.
 * Returns "pt" for any Portuguese variant (pt-BR, pt-PT, etc.), else "en".
 */
function detectLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language") ?? "";
  // Parse "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" → ["pt-BR", "pt", "en-US", "en"]
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .find((lang) => SUPPORTED_LOCALES.some((loc) => lang === loc || lang.startsWith(loc + "-")));

  if (preferred?.startsWith("pt")) return "pt";
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, Next.js internals, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.match(/\.\w+$/)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Only set the locale cookie on first visit (cookie not present)
  const existingLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (!existingLocale || !SUPPORTED_LOCALES.includes(existingLocale)) {
    const detected = detectLocale(request);
    response.cookies.set(COOKIE_NAME, detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: false, // needs to be readable by JS for the toggle
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
