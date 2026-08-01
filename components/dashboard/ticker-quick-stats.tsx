import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import type { TickerQuote } from "@/lib/dividend-data/types";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatRange(low: number | null, high: number | null) {
  if (low == null || high == null) return "—";
  return `${low.toFixed(2)} - ${high.toFixed(2)}`;
}

function formatCompactVolume(value: number | null) {
  if (value == null) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return String(value);
}

/**
 * Compact below-chart stat row — Open/Day Range/52-Week Range/Volume/
 * Avg. Volume, plus Expense Ratio when it's actually a fund (the field
 * is simply absent for equities, verified live against AAPL vs SCHD —
 * so the cell is omitted rather than shown as a dash for stocks it
 * genuinely doesn't apply to).
 */
export function TickerQuickStats({ quote }: { quote: TickerQuote }) {
  const cells: Array<{ label: string; value: string; tip?: string }> = [
    { label: "Open", value: formatMoney(quote.open) },
    { label: "Day Range", value: formatRange(quote.dayLow, quote.dayHigh) },
    { label: "52W Range", value: formatRange(quote.fiftyTwoWeekLow, quote.fiftyTwoWeekHigh), tip: TIPS.fiftyTwoWeek },
    { label: "Volume", value: formatCompactVolume(quote.volume) },
    { label: "Avg. Volume", value: formatCompactVolume(quote.averageVolume3Month) },
  ];
  if (quote.netExpenseRatio != null) {
    cells.push({ label: "Expense Ratio", value: `${quote.netExpenseRatio.toFixed(2)}%` });
  }

  return (
    <div className="grid grid-cols-2 gap-x-sp-3 gap-y-sp-2 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((cell) => (
        <div key={cell.label} className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            {cell.label}
            {cell.tip ? <InfoTip label={cell.tip} /> : null}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">{cell.value}</span>
        </div>
      ))}
    </div>
  );
}
