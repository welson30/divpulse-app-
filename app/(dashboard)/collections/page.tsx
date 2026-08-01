import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";
import { CollectionSearch } from "@/components/dashboard/collection-search";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";

export const metadata: Metadata = {
  title: "Collections — PaidPrime",
};

export default async function CollectionsPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, description, collection_tickers(ticker, sort_order)")
    .order("sort_order", { ascending: true });

  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col gap-sp-4">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Discover</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Collections</h1>
        </div>
        <CollectionSearch />
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">No collections curated yet.</p>
        </div>
      </div>
    );
  }

  // Every ticker across every collection, enriched in two batched
  // requests rather than one round trip per ticker.
  const allTickers = [...new Set(collections.flatMap((c) => c.collection_tickers.map((t) => t.ticker)))];
  const enriched = await enrichTickers(allTickers);

  return (
    <div className="min-w-0 flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10">
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Discover</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Collections</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Curated groupings of dividend payers, with live prices and trailing yield.
          </p>
        </div>
      </div>

      <CollectionSearch />

      {collections.map((collection) => {
        const rows: CollectionRow[] = [...collection.collection_tickers]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((t) => {
            const info = enriched.get(t.ticker.toUpperCase());
            const quote = info?.quote;
            // dividendYieldPercent arrives already as a percentage, while
            // trailingAnnualDividendYield is a fraction — and the latter
            // reads 0 for most funds, which is why it isn't preferred here.
            const yieldPct =
              quote?.dividendYieldPercent != null
                ? quote.dividendYieldPercent / 100
                : (quote?.trailingAnnualDividendYield ?? null);
            return {
              ticker: t.ticker,
              price: quote?.price ?? null,
              currency: quote?.currency ?? null,
              yieldPct,
              name: info?.name ?? null,
              logoUrl: info?.logoUrl ?? null,
              changePercent: quote?.changePercent ?? null,
              sparkline: info?.sparkline ?? [],
            };
          });

        return (
          <div key={collection.id} className="min-w-0 flex flex-col gap-sp-2">
            <div>
              <h2 className="text-h2 font-display font-medium text-text-primary">{collection.name}</h2>
              {collection.description ? (
                <p className="text-sm text-text-secondary">{collection.description}</p>
              ) : null}
            </div>
            <CollectionTable rows={rows} />
          </div>
        );
      })}
    </div>
  );
}
