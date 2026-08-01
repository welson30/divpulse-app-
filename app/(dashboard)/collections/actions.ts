"use server";

import { searchTickers } from "@/lib/tickers/search";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { createClient } from "@/lib/supabase/server";
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

    return {
      ticker: match.ticker,
      price: quote?.price ?? null,
      currency: quote?.currency ?? null,
      yieldPct: getYieldPct(quote),
      name: info?.name ?? match.name,
      logoUrl: info?.logoUrl ?? null,
      changePercent: quote?.changePercent ?? null,
      sparkline: info?.sparkline ?? [],
    };
  });
}

export type CollectionSearchResult = { id: string; name: string; category: string };

/**
 * Full collection list for the header command palette — small (one row
 * per curated collection, not per ticker), public-read data (same RLS as
 * the Collections page itself), so a single fetch on first palette-open is
 * cheap enough to just filter client-side rather than round-tripping per
 * keystroke like the ticker search above.
 */
export async function listCollectionsForSearch(): Promise<CollectionSearchResult[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("id, name, category").order("sort_order", { ascending: true });
  return data ?? [];
}
