"use server";

import { searchTickers } from "@/lib/tickers/search";
import { enrichTickers } from "@/lib/tickers/enrich";
import type { CollectionRow } from "@/components/dashboard/collection-table";

/**
 * Powers the free-text search box on Collections — looks up any ticker via
 * Yahoo's search endpoint, then enriches the matches with the same
 * price/logo/sparkline data the curated collections use, so the results
 * render through the same CollectionTable (Watch button included).
 */
export async function searchCollectionTickers(query: string): Promise<CollectionRow[]> {
  const matches = await searchTickers(query);
  if (matches.length === 0) return [];

  const enriched = await enrichTickers(matches.map((m) => m.ticker));

  return matches.map((match) => {
    const info = enriched.get(match.ticker);
    const quote = info?.quote;
    // Same preference as the curated collections: dividendYieldPercent is
    // accurate for conventional payers, trailingAnnualDividendYield reads
    // 0 for most funds.
    const yieldPct =
      quote?.dividendYieldPercent != null
        ? quote.dividendYieldPercent / 100
        : (quote?.trailingAnnualDividendYield ?? null);

    return {
      ticker: match.ticker,
      price: quote?.price ?? null,
      currency: quote?.currency ?? null,
      yieldPct,
      name: info?.name ?? match.name,
      logoUrl: info?.logoUrl ?? null,
      changePercent: quote?.changePercent ?? null,
      sparkline: info?.sparkline ?? [],
    };
  });
}
