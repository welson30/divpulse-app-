import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { DiversificationDonut } from "@/components/dashboard/diversification-donut";

export const metadata: Metadata = {
  title: "Diversification — PaidPrime",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  EQUITY: "Stock",
  ETF: "ETF",
  MUTUALFUND: "Mutual fund",
};

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
  const bySector = new Map<string, number>();
  const byAssetType = new Map<string, number>();

  for (const holding of holdings) {
    const quote = quoteByTicker.get(holding.ticker);
    const shares = Number(holding.shares);
    // Fall back to raw share count for any ticker whose quote lookup
    // failed, so one bad ticker doesn't zero out the whole chart.
    const value = quote?.price ? shares * quote.price : shares;

    byTicker.set(holding.ticker, (byTicker.get(holding.ticker) ?? 0) + value);
    const broker = holding.broker_name?.trim() || "Unspecified";
    byBroker.set(broker, (byBroker.get(broker) ?? 0) + value);

    const sector = quote?.sector || (quote?.quoteType ? (ASSET_TYPE_LABELS[quote.quoteType] ?? quote.quoteType) : "Unknown");
    bySector.set(sector, (bySector.get(sector) ?? 0) + value);

    const assetType = quote?.quoteType ? (ASSET_TYPE_LABELS[quote.quoteType] ?? quote.quoteType) : "Unknown";
    byAssetType.set(assetType, (byAssetType.get(assetType) ?? 0) + value);
  }

  const toSegments = (map: Map<string, number>) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  const tickerSegments = toSegments(byTicker);
  const brokerSegments = toSegments(byBroker);
  const sectorSegments = toSegments(bySector);
  const assetTypeSegments = toSegments(byAssetType);

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Diversification</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Weighted by dollar value — live price × shares held for each position.
        </p>
      </div>

      <div className="grid gap-sp-3 md:grid-cols-2">
        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By holding</h2>
          <DiversificationDonut segments={tickerSegments} />
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By broker</h2>
          <DiversificationDonut segments={brokerSegments} />
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By sector</h2>
          <DiversificationDonut segments={sectorSegments} />
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By asset type</h2>
          <DiversificationDonut segments={assetTypeSegments} />
        </div>
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
