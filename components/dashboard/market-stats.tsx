import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/dashboard/info-tip";
import { Sparkline } from "@/components/dashboard/sparkline";
import type { SparklinePoint } from "@/lib/dividend-data/types";

/**
 * A headline figure with an optional signed delta beneath it.
 *
 * The delta is what carries the colour: green when up, red when down,
 * following DESIGN.md's rule that those two are reserved for gain and
 * loss rather than decoration. Cards without a delta stay neutral instead
 * of being tinted for visual interest.
 */
export function StatCard({
  label,
  value,
  sub,
  changeAmount,
  changePercent,
  tip,
  sparkline,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  changeAmount?: number | null;
  changePercent?: number | null;
  tip?: string;
  sparkline?: SparklinePoint[];
  className?: string;
}) {
  const hasChange = changeAmount != null || changePercent != null;
  const isUp = (changePercent ?? changeAmount ?? 0) >= 0;
  const signed = (n: number, digits = 2) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border-subtle bg-surface p-sp-3",
        hasChange && (isUp ? "border-green-500/25" : "border-red-500/25"),
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">{label}</span>
        {tip ? <InfoTip label={tip} /> : null}
      </div>

      <div className="mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums text-text-primary">{value}</div>

      {hasChange ? (
        <div className={cn("mt-1 flex items-center gap-1.5 font-mono text-xs tabular-nums", isUp ? "text-green-500" : "text-red-500")}>
          <span aria-hidden>{isUp ? "▲" : "▼"}</span>
          {changeAmount != null ? <span>${Math.abs(changeAmount).toFixed(2)}</span> : null}
          {changePercent != null ? <span>({signed(changePercent)}%)</span> : null}
          <span className="text-text-secondary">today</span>
        </div>
      ) : sub ? (
        <div className="mt-1 text-xs text-text-secondary">{sub}</div>
      ) : null}

      {sparkline && sparkline.length > 1 ? (
        <div className="mt-2 -mb-1">
          <Sparkline points={sparkline} id={`stat-${label.replace(/\s/g, "")}`} changePercent={changePercent} width={200} height={32} className="w-full" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Where the current price sits between two bounds — a day's low/high or a
 * 52-week range. Trading apps lead with this because a bare price says
 * nothing about whether it's near a peak or a floor.
 */
export function RangeBar({
  low,
  high,
  current,
  label,
  className,
}: {
  low: number | null | undefined;
  high: number | null | undefined;
  current: number | null | undefined;
  label?: string;
  className?: string;
}) {
  if (low == null || high == null || current == null || high <= low) return null;

  // Clamped: a price can briefly print outside the stored 52-week bounds
  // before Yahoo refreshes them, which would otherwise push the marker
  // off the end of the track.
  const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? <span className="font-mono text-[10px] tracking-[0.06em] text-text-secondary uppercase">{label}</span> : null}
      <div className="relative h-1 w-full rounded-full bg-surface-hover">
        <span
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary ring-2 ring-surface"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] tabular-nums text-text-secondary">
        <span>{low.toFixed(2)}</span>
        <span>{high.toFixed(2)}</span>
      </div>
    </div>
  );
}

const MARKET_STATE_LABELS: Record<string, string> = {
  REGULAR: "Market open",
  PRE: "Pre-market",
  PREPRE: "Pre-market",
  POST: "After hours",
  POSTPOST: "After hours",
  CLOSED: "Market closed",
};

/**
 * Live market status. `exchangeDelayMinutes === 0` means the feed is
 * real-time, which is worth stating — it's the difference between a
 * dashboard that looks live and one that looks like a stale export.
 */
export function MarketStateBadge({
  marketState,
  delayMinutes,
  className,
}: {
  marketState: string | null | undefined;
  delayMinutes?: number | null;
  className?: string;
}) {
  if (!marketState) return null;
  const label = MARKET_STATE_LABELS[marketState] ?? marketState;
  const isOpen = marketState === "REGULAR";
  const isClosed = marketState === "CLOSED";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] text-text-secondary", className)}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          isOpen ? "bg-green-500" : isClosed ? "bg-text-tertiary" : "bg-warning",
        )}
      />
      {label}
      {delayMinutes === 0 ? <span className="text-text-tertiary">· Real-time</span> : null}
    </span>
  );
}

/** Volume against its 3-month average — the standard "is today unusual?" read. */
export function VolumeStat({
  volume,
  average,
  className,
}: {
  volume: number | null | undefined;
  average: number | null | undefined;
  className?: string;
}) {
  if (volume == null) return null;
  const compact = (n: number) =>
    n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);
  const ratio = average && average > 0 ? volume / average : null;

  return (
    <span className={cn("font-mono text-xs tabular-nums text-text-secondary", className)}>
      {compact(volume)}
      {ratio ? <span className={ratio >= 1.5 ? "text-warning" : "text-text-tertiary"}> · {ratio.toFixed(1)}× avg</span> : null}
    </span>
  );
}
