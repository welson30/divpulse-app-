import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Search } from "lucide-react";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { CURATED_LISTS } from "@/lib/etf-explorer/curated-lists";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { EtfSearch } from "@/components/dashboard/etf-search";

export const metadata: Metadata = {
  title: "ETF Explorer — PaidPrime",
};

// Revalidate every 5 minutes so yield / price data stays reasonably fresh
// without hammering Yahoo Finance on every request.
export const revalidate = 300;

export default async function EtfExplorerPage() {
  // Collect all tickers across all curated lists and enrich in one batch.
  const allTickers = [...new Set(CURATED_LISTS.flatMap((l) => l.tickers))];
  const enriched = await enrichTickers(allTickers, "1mo");

  return (
    <div className="flex flex-col gap-sp-6">
      <GreetingBackdrop />

      {/* Header */}
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
          Discover
        </span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">ETF Explorer</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Curated dividend ETFs and REITs — browse by payment frequency or search any ticker.
        </p>
      </div>

      {/* Search */}
      <EtfSearch />

      {/* Curated lists */}
      <div className="flex flex-col gap-sp-8">
        {CURATED_LISTS.map((list) => {
          const rows: CollectionRow[] = list.tickers.map((ticker) => {
            const e = enriched.get(ticker);
            return {
              ticker,
              price: e?.quote?.price ?? null,
              currency: e?.quote?.currency ?? null,
              yieldPct: getYieldPct(e?.quote),
              name: e?.name ?? null,
              logoUrl: e?.logoUrl ?? null,
              changePercent: e?.quote?.changePercent ?? null,
              sparkline: e?.sparkline ?? [],
            };
          });

          return (
            <section key={list.id}>
              <div className="mb-sp-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-h2 font-display font-semibold text-text-primary">{list.title}</h2>
                  <p className="mt-0.5 text-sm text-text-secondary">{list.description}</p>
                </div>
                <Link
                  href={`/etf-explorer/list/${list.id}`}
                  className="shrink-0 font-mono text-xs text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <CollectionTable rows={rows} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
