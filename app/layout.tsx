import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Self-hosted via next/font (build-time fetch + preload) in place of the
// blocking Google Fonts @import used in Design-System/colors_and_type.css —
// see DESIGN.md §11 "Font loading" for why the CDN @import isn't used in
// production. Variable weight covers the full range each role needs.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

// NEXT_PUBLIC_SITE_URL should only be set in production (Vercel env vars)
// — falls back to localhost so metadata/OG tags never point at the prod
// domain during local dev. No NODE_ENV branching needed: this var simply
// shouldn't exist in .env locally.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PaidPrime — Know the moment you're paid",
  description:
    "Real-time dividend alerts by push, Telegram, and email — the moment a payment lands, before your broker's app tells you. Track holdings, payment calendars, and income goals. Free for 5 assets.",
  openGraph: {
    title: "PaidPrime — Know the moment you're paid",
    description:
      "Real-time dividend alerts by push, Telegram, and email — before your broker's app tells you.",
    url: siteUrl,
    siteName: "PaidPrime",
    type: "website",
  },
};

// dark-only by deliberate brand decision (DESIGN.md §10) — no
// prefers-color-scheme handling, so color-scheme is pinned to dark
// rather than left to the OS (native scrollbars/form controls, etc).
// themeColor matches app/manifest.ts's --green-900, not raw --bg-base.
export const viewport: Viewport = {
  themeColor: "#14532D",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", interTight.variable, inter.variable, jetbrainsMono.variable)}
    >
      <head>
        {/* OneSignal's own documented integration snippet, verbatim, in
            <head> on every page — not injected later via next/script,
            since OneSignal's setup instructions specifically call for
            this placement and timing. components/onesignal/onesignal-provider.tsx's
            getOneSignal() helper still awaits this same OneSignalDeferred
            queue for login()/requestPermission() calls; it no longer
            queues its own init() to avoid a duplicate init attempt. */}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
                });
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
