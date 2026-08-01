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
const ICON_CHIP_COLORS = {
  green: "bg-[rgba(34,197,94,0.12)] text-green-500",
  amber: "bg-warning/12 text-warning",
  blue: "bg-info/12 text-info",
} as const;

export function StatCard({
  label,
  value,
  sub,
  changeAmount,
  changePercent,
  tip,
  sparkline,
  icon: Icon,
  iconColor = "green",
  compact = false,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  changeAmount?: number | null;
  changePercent?: number | null;
  tip?: string;
  sparkline?: SparklinePoint[];
  /** Small circular chip in the top-right corner — optional, purely decorative. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Chip tint — lets a row of cards for distinct concepts (e.g. payments/ex-dates/today) use distinct colors instead of all defaulting to green. */
  iconColor?: keyof typeof ICON_CHIP_COLORS;
  /**
   * Tighter padding/type scale below `lg:`, full size from `lg:` up —
   * for a tile that's cramped into a 3-across mobile row but sits in a
   * normal 4-up grid at desktop width (dashboard's secondary stats).
   * Baked in as responsive classes, not a flat size choice, since this
   * is a single server-rendered class string that has to look right at
   * every viewport, not something re-rendered per breakpoint.
   */
  compact?: boolean;
  className?: string;
}) {
  const hasChange = changeAmount != null || changePercent != null;
  const isUp = (changePercent ?? changeAmount ?? 0) >= 0;
  const signed = (n: number, digits = 2) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;

  // A flat series (e.g. a brand-new account with 12 real-but-all-zero
  // months) would otherwise draw as a meaningless straight line — same
  // problem as a truly empty one, just not caught by a length check.
  // `sparkline` being passed at all (vs. omitted entirely) is what
  // decides whether this slot renders something instead of nothing.
  const hasSparkline = sparkline != null;
  const hasMeaningfulSparkline =
    hasSparkline && sparkline.length > 1 && sparkline.some((p) => p.c !== sparkline[0]!.c);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border-subtle bg-surface",
        compact ? "p-sp-2 lg:p-sp-3" : "p-sp-3",
        hasChange && (isUp ? "border-green-500/25" : "border-red-500/25"),
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full",
            ICON_CHIP_COLORS[iconColor],
            // A 3-across compact row (dashboard's secondary tiles, this
            // page's stat row) leaves ~65-100px of *content* width per
            // card after grid gaps and card padding on a 360px phone —
            // the size-6/right-sp-2 chip alone was eating 40px of that,
            // more than half. Smaller and closer to the corner below
            // `lg:`, back to the original size once there's real room.
            compact ? "top-1.5 right-1.5 size-4.5 lg:top-sp-2 lg:right-sp-2 lg:size-7" : "top-sp-2 right-sp-2 size-7",
          )}
        >
          <Icon className={compact ? "size-2.5 lg:size-3.5" : "size-3.5"} />
        </span>
      ) : null}

      <div className={cn("flex items-center gap-1.5", Icon && (compact ? "pr-5 lg:pr-8" : "pr-8"))}>
        <span className={cn("text-text-secondary", compact ? "text-[11px] lg:text-xs" : "text-xs")}>{label}</span>
        {tip ? <InfoTip label={tip} /> : null}
      </div>

      <div
        className={cn(
          "mt-1 font-mono font-bold tracking-tight tabular-nums text-text-primary",
          compact ? "text-lg lg:text-2xl" : "text-2xl",
          // The icon chip extends further down than just the label row
          // above — a value like "$674.76" can reach far enough right to
          // sit under it without this same reservation. Matches the
          // chip's own compact-vs-full sizing above.
          Icon && (compact ? "pr-5 lg:pr-8" : "pr-8"),
        )}
      >
        {value}
      </div>

      {hasChange ? (
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 font-mono tabular-nums",
            compact ? "text-[11px] lg:text-xs" : "text-xs",
            isUp ? "text-green-500" : "text-red-500",
          )}
        >
          <span aria-hidden>{isUp ? "▲" : "▼"}</span>
          {changeAmount != null ? <span>${Math.abs(changeAmount).toFixed(2)}</span> : null}
          {changePercent != null ? <span>({signed(changePercent)}%)</span> : null}
          <span className={cn("text-text-secondary", compact && "hidden lg:inline")}>today</span>
        </div>
      ) : sub ? (
        <div className={cn("mt-1 text-text-secondary", compact ? "text-[11px] lg:text-xs" : "text-xs")}>{sub}</div>
      ) : null}

      {hasSparkline ? (
        <div className="mt-2 -mb-1">
          {hasMeaningfulSparkline ? (
            <Sparkline points={sparkline} id={`stat-${label.replace(/\s/g, "")}`} changePercent={changePercent} width={200} height={32} className="w-full" />
          ) : (
            <div className="flex h-8 items-center justify-center font-mono text-[10px] text-text-tertiary">No trend data yet</div>
          )}
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
