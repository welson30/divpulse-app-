import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, RefreshCw, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Page Not Found | PaidPrime",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#09090B] px-4 py-12 font-sans antialiased">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(248,113,113,0.08)_0%,rgba(34,197,94,0.05)_50%,transparent_80%)] blur-3xl"
        aria-hidden
      />

      {/* Top logo branding */}
      <div className="mb-8 flex items-center gap-2.5">
        <Image
          src="/logo.svg"
          alt="PaidPrime logo"
          width={32}
          height={32}
          priority
          className="rounded-lg"
        />
        <span className="font-display text-lg font-bold tracking-tight text-white">
          Paid<span className="text-[#22C55E]">Prime</span>
        </span>
      </div>

      {/* Central 404 Financial Card */}
      <div className="relative z-10 w-full max-w-[540px] rounded-2xl border border-[#303034] bg-[#1C1C1E]/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        {/* Card Header — Mock Ticker Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303034] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 font-mono text-sm font-bold text-[#F87171]">
              404
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white tracking-wide">
                  ERR-404
                </span>
                <span className="rounded-[5px] bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#F87171] uppercase tracking-wider">
                  DELISTED
                </span>
              </div>
              <p className="font-mono text-xs text-[#A1A1AA]">
                Route / Asset Not Found
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="flex items-center justify-end gap-1 text-sm font-bold text-[#F87171]">
              <TrendingDown className="size-4" />
              <span>−100.00%</span>
            </div>
            <span className="text-[11px] text-[#A1A1AA]">Market Closed</span>
          </div>
        </div>

        {/* Financial Chart SVG (Green Growth → Red Dip → Green Bounce) */}
        <div className="relative my-6 h-36 w-full overflow-hidden rounded-xl border border-[#303034]/60 bg-[#09090B]/80 p-3">
          <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-[11px] text-[#7D7D85]">
            <span className="inline-block size-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>REALTIME PRICE HISTORY</span>
          </div>

          <svg
            viewBox="0 0 500 120"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F87171" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke="#303034" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1="0" y1="70" x2="500" y2="70" stroke="#303034" strokeDasharray="3 3" strokeOpacity="0.4" />

            {/* Green initial wave */}
            <path
              d="M0 75 Q 40 50, 80 65 T 160 40 T 220 50 L 220 120 L 0 120 Z"
              fill="url(#greenFill)"
            />
            <path
              d="M0 75 Q 40 50, 80 65 T 160 40 T 220 50"
              stroke="#22C55E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Red crash dip to 404 point */}
            <path
              d="M220 50 L 270 105 L 320 102 L 320 120 L 220 120 Z"
              fill="url(#redFill)"
            />
            <path
              d="M220 50 L 270 105 L 320 102"
              stroke="#F87171"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              className="animate-pulse"
            />

            {/* Recovery line back up */}
            <path
              d="M320 102 Q 370 70, 420 45 T 500 25 L 500 120 L 320 120 Z"
              fill="url(#greenFill)"
            />
            <path
              d="M320 102 Q 370 70, 420 45 T 500 25"
              stroke="#22C55E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* 404 Marker Pin */}
            <g transform="translate(270, 105)">
              <circle r="5" fill="#F87171" />
              <circle r="9" fill="none" stroke="#F87171" strokeWidth="1.5" className="animate-ping" opacity="0.75" />
            </g>
          </svg>

          <div className="absolute right-3 bottom-2 font-mono text-[10px] text-[#A1A1AA]">
            Ticker Status: <span className="font-bold text-[#F87171]">404_NOT_FOUND</span>
          </div>
        </div>

        {/* Message Content */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Asset Not Found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            The page or position you&rsquo;re searching for doesn&rsquo;t exist, has been delisted, or was moved to another route.
          </p>
        </div>

        {/* Stat metrics teaser */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[#303034]/70 bg-[#09090B]/60 p-3 text-left">
          <div>
            <span className="font-mono text-[10px] font-semibold text-[#7D7D85] uppercase tracking-wider">
              Status Code
            </span>
            <div className="font-mono text-sm font-bold text-white">404 HTTP</div>
          </div>
          <div>
            <span className="font-mono text-[10px] font-semibold text-[#7D7D85] uppercase tracking-wider">
              Suggested Action
            </span>
            <div className="font-mono text-sm font-bold text-[#22C55E]">Rebalance Route</div>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-3 font-sans text-sm font-semibold text-[#09090B] transition-all hover:bg-[#16A34A] active:scale-[0.98]"
          >
            <Home className="size-4" />
            Return to Dashboard
          </Link>
          <Link
            href="/collections"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#303034] bg-transparent px-4 py-3 font-sans text-sm font-semibold text-white transition-all hover:border-[#7D7D85] hover:bg-white/5 active:scale-[0.98]"
          >
            <RefreshCw className="size-4 text-[#A1A1AA]" />
            Explore Collections
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center font-mono text-xs text-[#7D7D85]">
        &copy; {new Date().getFullYear()} PaidPrime &mdash; Real-time Dividend Intelligence
      </footer>
    </main>
  );
}
