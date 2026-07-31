"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TickerLogoProps = {
  ticker: string;
  /** Resolved server-side via lib/tickers/logo.ts; null falls back to a monogram. */
  logoUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Company / fund logo shown beside a ticker.
 *
 * Rounded square on an elevated surface rather than the circular badge
 * most brokerages use — it matches the existing `.receipt .mark`
 * treatment and keeps square logos (most issuer marks) from being
 * cropped. `object-contain` on a fixed backdrop means logos of wildly
 * different aspect ratios and transparency all sit consistently.
 *
 * The monogram renders as the permanent base layer, not a conditional
 * fallback — the logo image sits on top of it, starting invisible and
 * fading in only once it actually finishes loading (`onLoad`). A URL
 * that 404s (e.g. Logo.dev's `fallback=404` when it has no match
 * either) never becomes visible at all, so the browser's native broken-
 * image icon never flashes on screen; it just silently leaves the
 * monogram showing, which was already the correct render underneath.
 */
export function TickerLogo({ ticker, logoUrl, size = "md", className }: TickerLogoProps) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const px = size === "sm" ? 26 : 36;
  const monogram = ticker.slice(0, size === "sm" ? 2 : 3).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-border-subtle bg-surface-2",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <span aria-hidden className="font-mono text-[9px] font-semibold tracking-tight text-text-secondary">
        {monogram}
      </span>
      {logoUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote third-party favicon, not a local asset; next/image would need a remotePatterns entry for no benefit at this size
        <img
          src={logoUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain p-[3px] transition-opacity duration-150"
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      ) : null}
    </div>
  );
}
