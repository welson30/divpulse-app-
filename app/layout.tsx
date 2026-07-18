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

export const metadata: Metadata = {
  metadataBase: new URL("https://paidprime.com"),
  title: "PaidPrime — Know the moment you're paid",
  description:
    "Real-time dividend alerts by push, Telegram, and email — the moment a payment lands, before your broker's app tells you. Track holdings, payment calendars, and income goals. Free for 5 assets.",
  openGraph: {
    title: "PaidPrime — Know the moment you're paid",
    description:
      "Real-time dividend alerts by push, Telegram, and email — before your broker's app tells you.",
    url: "https://paidprime.com",
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
      className={cn("h-full", interTight.variable, inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
