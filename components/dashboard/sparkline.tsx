import type { SparklinePoint } from "@/lib/dividend-data/types";
import { cn } from "@/lib/utils";

type SparklineProps = {
  points: SparklinePoint[];
  /**
   * Unique per instance — SVG gradient ids are document-global, so a
   * shared one would make every sparkline on the page adopt the first
   * one's colour. The ticker is a natural choice.
   */
  id: string;
  /**
   * Drives the colour so the line always agrees with the change figure
   * printed beside it. Falls back to the series' own direction.
   */
  changePercent?: number | null;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Hand-rolled SVG price sparkline — green when up, red when down, in the
 * trading-terminal idiom the client asked for.
 *
 * Deliberately not a charting library: this is a polyline plus a fill,
 * and the alternatives cost far more than they'd save here (recharts
 * pulls in 11 transitive packages including Redux). Staying on raw SVG
 * also keeps it a server component — 15 rows render with zero client
 * JavaScript — and matches how diversification-donut.tsx and
 * marketing/mini-charts.tsx already draw their charts.
 *
 * Colour use is on-spec rather than decorative: DESIGN.md reserves
 * --green-500 for gains and --red-500 for losses, which is exactly what
 * direction means here.
 */
export function Sparkline({ points, id, changePercent, width = 88, height = 28, className }: SparklineProps) {
  if (points.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-[10px] text-text-secondary", className)}
        style={{ width, height }}
        aria-hidden
      >
        —
      </div>
    );
  }

  const closes = points.map((p) => p.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min;

  // Inset vertically so the 2px stroke isn't clipped at the extremes.
  const pad = 2;
  const plot = height - pad * 2;

  const coords = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    // A perfectly flat series has no range to normalise against — draw it
    // down the middle rather than dividing by zero.
    const y = span === 0 ? height / 2 : pad + ((max - c) / span) * plot;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const isUp = changePercent != null ? changePercent >= 0 : closes[closes.length - 1]! >= closes[0]!;
  const stroke = isUp ? "var(--green-500)" : "var(--red-500)";
  const gradientId = `spark-${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("shrink-0 overflow-visible", className)}
      // The adjacent price/change text already states the trend; a second
      // announcement per row would just be noise for screen readers.
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${coords.join(" ")} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Signed, colour-coded percentage move — the number beside the sparkline. */
export function ChangeBadge({ changePercent, className }: { changePercent: number | null; className?: string }) {
  if (changePercent == null) return <span className={cn("text-text-secondary", className)}>—</span>;
  const isUp = changePercent >= 0;
  return (
    <span className={cn("font-mono tabular-nums", isUp ? "text-green-500" : "text-red-500", className)}>
      {isUp ? "+" : ""}
      {changePercent.toFixed(2)}%
    </span>
  );
}
