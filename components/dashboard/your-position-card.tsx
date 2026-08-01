import { StatCard } from "@/components/dashboard/market-stats";
import { TIPS } from "@/lib/tips";

export type PositionHolding = { shares: number; brokerName: string | null };

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(fraction: number | null) {
  if (fraction == null) return "—";
  return `${(fraction * 100).toFixed(2)}%`;
}

/**
 * "You own N shares worth $X" — only rendered by the page when the user
 * actually holds this ticker. trailingIncome comes from
 * computeTrailingIncome (lib/dividend-data/income.ts), unmodified — not
 * re-derived here, since that's the one already-proven-correct income
 * number in the app. Dividend Yield here is the same Yahoo-sourced,
 * informational-only figure shown in KeyStatsGrid (TIPS.dividendYield
 * carries the accuracy caveat) — trailingIncome above it is still the
 * number that actually reflects what this position paid.
 */
export function YourPositionCard({
  holdings,
  price,
  previousClose,
  trailingIncome,
  dividendYieldPercent,
}: {
  holdings: PositionHolding[];
  price: number | null;
  previousClose: number | null;
  trailingIncome: number;
  dividendYieldPercent: number | null;
}) {
  const totalShares = holdings.reduce((sum, h) => sum + h.shares, 0);
  const marketValue = price != null ? totalShares * price : null;
  const changeAmount = price != null && previousClose ? (price - previousClose) * totalShares : null;
  const changePercent = price != null && previousClose ? ((price - previousClose) / previousClose) * 100 : null;
  const brokersWithNames = holdings.filter((h) => h.brokerName);

  return (
    <div className="flex flex-col gap-sp-2">
      <h2 className="text-h2 font-display font-medium text-text-primary">Your position</h2>
      <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-2">
        <StatCard label="Shares" value={totalShares.toLocaleString("en-US")} />
        <StatCard label="Market value" value={formatMoney(marketValue)} changeAmount={changeAmount} changePercent={changePercent} />
        <StatCard label="Trailing 12mo income" value={formatMoney(trailingIncome)} tip={TIPS.annualIncome} />
        <StatCard
          label="Dividend yield"
          value={formatPercent(dividendYieldPercent != null ? dividendYieldPercent / 100 : null)}
          tip={TIPS.dividendYield}
        />
      </div>
      {holdings.length > 1 ? (
        <div className="flex flex-col gap-1.5 rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <span className="text-xs text-text-secondary">By broker</span>
          {holdings.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{h.brokerName ?? "Unspecified"}</span>
              <span className="font-mono tabular-nums text-text-primary">{h.shares.toLocaleString("en-US")} shares</span>
            </div>
          ))}
        </div>
      ) : brokersWithNames.length === 1 ? (
        <p className="text-xs text-text-secondary">via {brokersWithNames[0].brokerName}</p>
      ) : null}
    </div>
  );
}
