import type { Metadata } from "next";
import { Boxes, Crown, Factory, Gauge, Landmark, Layers, PieChart, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { DiversificationDonut, type DonutSegment } from "@/components/dashboard/diversification-donut";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { StatCard } from "@/components/dashboard/market-stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Diversification — PaidPrime",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  EQUITY: "Stock",
  ETF: "ETF",
  MUTUALFUND: "Mutual fund",
};

function BreakdownCard({
  title,
  icon: Icon,
  chipClass,
  segments,
  noun,
}: {
  title: string;
  icon: LucideIcon;
  chipClass: string;
  segments: DonutSegment[];
  noun: string;
}) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
      <div className="mb-sp-3 flex items-center gap-2.5">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", chipClass)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-h2 font-display font-medium text-text-primary">{title}</h2>
          <p className="text-xs text-text-secondary">
            {segments.length} {segments.length === 1 ? noun : `${noun}s`}
          </p>
        </div>
      </div>
      <DiversificationDonut segments={segments} />
    </div>
  );
}

export default async function DiversificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, broker_name")
    .eq("user_id", user!.id);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Diversification</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to see how your portfolio is spread out.</p>
        </div>
      </div>
    );
  }

  const provider = getDividendDataProvider();
  const distinctTickers = [...new Set(holdings.map((h) => h.ticker))];
  const quotes = await Promise.all(
    distinctTickers.map(async (ticker) => {
      try {
        return await provider.fetchQuote(ticker);
      } catch {
        return null;
      }
    }),
  );
  const quoteByTicker = new Map(distinctTickers.map((ticker, i) => [ticker, quotes[i]]));

  const pricesMissing = distinctTickers.some((t) => !quoteByTicker.get(t)?.price);

  const byTicker = new Map<string, number>();
  const byBroker = new Map<string, number>();
  // broker_name is free text (typed once per holding, no autocomplete) —
  // "Fidelity" and "fidelity" are the same broker to a human but different
  // Map keys without this, silently splitting one broker into two slices.
  // Grouped by a normalized key; brokerLabels keeps the first-seen casing
  // as the display label so the chart still shows a name the user typed,
  // not a forced-lowercase one.
  const brokerLabels = new Map<string, string>();
  const bySector = new Map<string, number>();
  const byAssetType = new Map<string, number>();

  for (const holding of holdings) {
    const quote = quoteByTicker.get(holding.ticker);
    const shares = Number(holding.shares);
    // Fall back to raw share count for any ticker whose quote lookup
    // failed, so one bad ticker doesn't zero out the whole chart.
    const value = quote?.price ? shares * quote.price : shares;

    byTicker.set(holding.ticker, (byTicker.get(holding.ticker) ?? 0) + value);
    const brokerRaw = holding.broker_name?.trim() || "Unspecified";
    const brokerKey = brokerRaw.toLowerCase();
    byBroker.set(brokerKey, (byBroker.get(brokerKey) ?? 0) + value);
    if (!brokerLabels.has(brokerKey)) brokerLabels.set(brokerKey, brokerRaw);

    const sector = quote?.sector || (quote?.quoteType ? (ASSET_TYPE_LABELS[quote.quoteType] ?? quote.quoteType) : "Unknown");
    bySector.set(sector, (bySector.get(sector) ?? 0) + value);

    const assetType = quote?.quoteType ? (ASSET_TYPE_LABELS[quote.quoteType] ?? quote.quoteType) : "Unknown";
    byAssetType.set(assetType, (byAssetType.get(assetType) ?? 0) + value);
  }

  const toSegments = (map: Map<string, number>) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  const tickerSegments = toSegments(byTicker);
  const brokerSegments = toSegments(byBroker).map((seg) => ({ ...seg, label: brokerLabels.get(seg.label) ?? seg.label }));
  const sectorSegments = toSegments(bySector);
  const assetTypeSegments = toSegments(byAssetType);

  // Every figure below is a real aggregate over the positions just
  // computed — no invented benchmarks or "ideal allocation" targets, just
  // what the portfolio's own numbers say about how concentrated it is.
  const portfolioValue = tickerSegments.reduce((sum, s) => sum + s.value, 0);
  const topHolding = tickerSegments[0] ?? null;
  const topHoldingPct = topHolding && portfolioValue > 0 ? (topHolding.value / portfolioValue) * 100 : 0;
  const isConcentrated = topHoldingPct >= 30;
  const isModerate = !isConcentrated && topHoldingPct >= 15;
  const riskLabel = isConcentrated ? "Concentrated" : isModerate ? "Moderate" : "Diversified";

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10">
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Diversification</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Weighted by dollar value — live price × shares held for each position.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 items-start gap-sp-2 lg:grid-cols-4">
        <StatCard
          label="Total Positions"
          value={String(distinctTickers.length)}
          sub={`across ${byBroker.size} ${byBroker.size === 1 ? "broker" : "brokers"}`}
          icon={Wallet}
          compact
        />
        <StatCard
          label="Sectors"
          value={String(bySector.size)}
          sub={`${byAssetType.size} asset ${byAssetType.size === 1 ? "type" : "types"}`}
          icon={Layers}
          iconColor="blue"
          compact
        />
        <StatCard
          label="Top Holding"
          value={topHolding?.label ?? "—"}
          sub={topHolding ? `${topHoldingPct.toFixed(1)}% of portfolio value` : undefined}
          icon={Crown}
          compact
        />
        <StatCard
          label="Concentration"
          value={riskLabel}
          sub={topHolding ? `Top position ${topHoldingPct.toFixed(0)}% of value` : undefined}
          icon={Gauge}
          iconColor={isConcentrated || isModerate ? "amber" : "green"}
          compact
        />
      </div>

      <div className="grid items-start gap-sp-3 md:grid-cols-2">
        <BreakdownCard
          title="By holding"
          icon={PieChart}
          chipClass="bg-[rgba(34,197,94,0.12)] text-green-500"
          segments={tickerSegments}
          noun="position"
        />
        <BreakdownCard
          title="By broker"
          icon={Landmark}
          chipClass="bg-info/12 text-info"
          segments={brokerSegments}
          noun="broker"
        />
        <BreakdownCard
          title="By sector"
          icon={Factory}
          chipClass="bg-warning/12 text-warning"
          segments={sectorSegments}
          noun="sector"
        />
        <BreakdownCard
          title="By asset type"
          icon={Boxes}
          chipClass="bg-surface-2 text-text-secondary"
          segments={assetTypeSegments}
          noun="asset type"
        />
      </div>

      {pricesMissing ? (
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <p className="text-sm text-text-secondary">
            Live price lookup failed for one or more tickers — those positions are shown weighted by share count
            instead of dollar value until the next refresh.
          </p>
        </div>
      ) : null}
    </div>
  );
}
