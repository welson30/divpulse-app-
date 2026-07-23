import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";

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
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Discover</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Collections</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">No collections curated yet.</p>
        </div>
      </div>
    );
  }

  const provider = getDividendDataProvider();
  const allTickers = [...new Set(collections.flatMap((c) => c.collection_tickers.map((t) => t.ticker)))];
  const quotes = await Promise.all(
    allTickers.map(async (ticker) => {
      try {
        return await provider.fetchQuote(ticker);
      } catch {
        return null;
      }
    }),
  );
  const quoteByTicker = new Map(allTickers.map((ticker, i) => [ticker, quotes[i]]));

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Discover</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Collections</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Curated groupings of dividend payers, with live prices and trailing yield.
        </p>
      </div>

      {collections.map((collection) => {
        const rows: CollectionRow[] = [...collection.collection_tickers]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((t) => {
            const quote = quoteByTicker.get(t.ticker);
            return {
              ticker: t.ticker,
              price: quote?.price ?? null,
              currency: quote?.currency ?? null,
              yieldPct: quote?.trailingAnnualDividendYield ?? null,
            };
          });

        return (
          <div key={collection.id} className="flex flex-col gap-sp-2">
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
