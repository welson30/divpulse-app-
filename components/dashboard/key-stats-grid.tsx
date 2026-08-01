import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import type { TickerQuote } from "@/lib/dividend-data/types";

/**
 * Green-filled range bar with a single floating "low - high" label that
 * tracks the marker's horizontal position, per the client's reference
 * mockup. Deliberately a local component, not a change to the shared
 * `RangeBar` in market-stats.tsx — that one is also used in
 * watchlist-table.tsx's compact 52-week column, and this taller,
 * floating-label treatment would visually bloat every row there. Scoped
 * to this one card instead.
 */
function TrackedRangeBar({
  label,
  low,
  high,
  current,
}: {
  label: string;
  low: number | null | undefined;
  high: number | null | undefined;
  current: number | null | undefined;
}) {
  if (low == null || high == null || current == null || high <= low) return null;

  const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
  // The dot tracks the real position; the label's own position is
  // clamped so its centered text never clips past the track's edges —
  // checked against the narrowest realistic case (a 320px phone, where
  // this card's inner content width is only ~224px after AppShell +
  // card padding), not just eyeballed at desktop width.
  const labelPct = Math.min(72, Math.max(28, pct));

  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-[0.06em] text-text-secondary uppercase">{label}</span>
      <div className="relative pt-5">
        <span
          className="absolute top-0 -translate-x-1/2 font-mono text-xs font-semibold whitespace-nowrap tabular-nums text-text-primary"
          style={{ left: `${labelPct}%` }}
        >
          {low.toFixed(2)}–{high.toFixed(2)}
        </span>
        <div className="relative h-1.5 w-full">
          <div className="absolute inset-0 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
          </div>
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary ring-2 ring-surface"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactMoney(value: number | null) {
  if (value == null) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatMoney(value);
}

function formatPercent(fraction: number | null) {
  if (fraction == null) return "—";
  return `${(fraction * 100).toFixed(2)}%`;
}

function formatRatio(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(2);
}

type Row = { label: string; value: string; tip?: string };

/**
 * Key-stats card for a ticker's detail page: two range bars, then a
 * vertical fact list (label left, value right) — Net Assets for funds
 * (netAssets is simply absent for equities, verified live), Market Cap
 * for equities, P/E, Dividend Yield, and Expense Ratio when it's a fund.
 *
 * Deliberately never defaults a missing Yahoo field to 0 — every
 * formatter above returns "—" for null, since for this app's
 * fund-heavy portfolio these fields are frequently and legitimately
 * empty (see docs/client-feedback-2026-07-31.md §2). A stray `?? 0`
 * here would repeat the exact bug class that turned "no data" into a
 * hard-zero income figure once already this session.
 *
 * Dividend Yield here is Yahoo's dividendYieldPercent — informational
 * only, not the primary income figure (that's YourPositionCard's
 * trailing-12mo sum from actual payment history). TIPS.dividendYield
 * already carries that caveat, reused verbatim.
 */
export function KeyStatsGrid({ quote }: { quote: TickerQuote }) {
  const sizeRow: Row =
    quote.netAssets != null
      ? { label: "Net Assets", value: formatCompactMoney(quote.netAssets) }
      : { label: "Market Cap", value: formatCompactMoney(quote.marketCap), tip: TIPS.marketCap };

  const rows: Row[] = [
    sizeRow,
    { label: "P/E Ratio", value: formatRatio(quote.trailingPE), tip: TIPS.peRatio },
    {
      label: "Dividend Yield",
      value: formatPercent(quote.dividendYieldPercent != null ? quote.dividendYieldPercent / 100 : null),
      tip: TIPS.dividendYield,
    },
  ];
  if (quote.netExpenseRatio != null) {
    rows.push({ label: "Expense Ratio", value: `${quote.netExpenseRatio.toFixed(2)}%` });
  }

  return (
    <div className="flex flex-col gap-sp-3 rounded-card border border-border-subtle bg-surface p-sp-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-sp-3">
        <TrackedRangeBar label="Day Range" low={quote.dayLow} high={quote.dayHigh} current={quote.price} />
        <TrackedRangeBar label="52 Week Range" low={quote.fiftyTwoWeekLow} high={quote.fiftyTwoWeekHigh} current={quote.price} />
      </div>

      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2.5 ${i === rows.length - 1 ? "" : "border-b border-border-subtle"}`}
          >
            <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
              {row.label}
              {row.tip ? <InfoTip label={row.tip} /> : null}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
