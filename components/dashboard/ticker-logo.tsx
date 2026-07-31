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
 * The monogram fallback is not a failure state: it's the correct render
 * for anything without a resolvable brand, and is styled to look
 * deliberate rather than broken.
 */
export function TickerLogo({ ticker, logoUrl, size = "md", className }: TickerLogoProps) {
  const px = size === "sm" ? 26 : 36;
  const monogram = ticker.slice(0, size === "sm" ? 2 : 3).toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-border-subtle bg-surface-2",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote third-party favicon, not a local asset; next/image would need a remotePatterns entry for no benefit at this size
        <img src={logoUrl} alt="" aria-hidden className="h-full w-full object-contain p-[3px]" loading="lazy" />
      ) : (
        <span aria-hidden className="font-mono text-[9px] font-semibold tracking-tight text-text-secondary">
          {monogram}
        </span>
      )}
    </div>
  );
}
