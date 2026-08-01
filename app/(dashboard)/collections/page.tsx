import type { Metadata } from "next";
import { Layers, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { getCategoryStyle } from "@/components/dashboard/collection-category-style";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";
import { CollectionSearch } from "@/components/dashboard/collection-search";
import { CollectionSectorFilter } from "@/components/dashboard/collection-sector-filter";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { StatCard } from "@/components/dashboard/market-stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Collections — PaidPrime",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector } = await searchParams;
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, category, description, created_at, collection_tickers(ticker, sort_order)")
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every ticker across every collection, enriched in two batched
  // requests rather than one round trip per ticker.
  const allTickers = [...new Set(collections.flatMap((c) => c.collection_tickers.map((t) => t.ticker)))];
  const [enriched, { data: watchlistItems }] = await Promise.all([
    enrichTickers(allTickers),
    supabase.from("watchlist_items").select("ticker").eq("user_id", user!.id),
  ]);

  const categories = [...new Set(collections.map((c) => c.category))];
  const activeSector = sector && categories.includes(sector) ? sector : "all";
  const visibleCollections = activeSector === "all" ? collections : collections.filter((c) => c.category === activeSector);

  // Portfolio-wide stats — every figure below is a real aggregate over
  // fetched data (created_at, live quotes, the user's own watchlist), not
  // an invented comparison — there's no historical snapshot to diff
  // against, so no "vs last month" deltas are shown unless they're real.
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const newThisMonth = collections.filter((c) => new Date(c.created_at) >= monthStart).length;

  let yieldSum = 0;
  let yieldCount = 0;
  let topTicker: string | null = null;
  let topChangePercent = -Infinity;
  for (const ticker of allTickers) {
    const quote = enriched.get(ticker.toUpperCase())?.quote;
    const yieldPct = getYieldPct(quote);
    if (yieldPct != null) {
      yieldSum += yieldPct;
      yieldCount += 1;
    }
    if (quote?.changePercent != null && quote.changePercent > topChangePercent) {
      topChangePercent = quote.changePercent;
      topTicker = ticker;
    }
  }
  const avgYieldPct = yieldCount > 0 ? (yieldSum / yieldCount) * 100 : null;
  const hasTopPerformer = topTicker != null && topChangePercent > -Infinity;
  const watchlistCount = watchlistItems?.length ?? 0;

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

      <div className="grid grid-cols-2 items-start gap-sp-2 lg:grid-cols-4">
        <StatCard
          label="Total Collections"
          value={String(collections.length)}
          sub={newThisMonth > 0 ? `${newThisMonth} new this month` : `${collections.length} curated ${collections.length === 1 ? "category" : "categories"}`}
          icon={Layers}
          compact
        />
        <StatCard
          label="Average Yield"
          value={avgYieldPct != null ? `${avgYieldPct.toFixed(2)}%` : "—"}
          sub={`across ${allTickers.length} ${allTickers.length === 1 ? "ticker" : "tickers"}`}
          icon={TrendingUp}
          compact
        />
        <StatCard
          label="Top Performer (1D)"
          value={topTicker ?? "—"}
          changePercent={hasTopPerformer ? topChangePercent : undefined}
          sub={hasTopPerformer ? undefined : "No data yet"}
          icon={TrendingUp}
          compact
        />
        <StatCard
          label="Watchlist Items"
          value={String(watchlistCount)}
          sub={`across ${collections.length} ${collections.length === 1 ? "collection" : "collections"}`}
          icon={Star}
          compact
        />
      </div>

      <CollectionSearch sectorFilter={<CollectionSectorFilter categories={categories} current={activeSector} />} />

      {visibleCollections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">No collections in this sector.</p>
        </div>
      ) : (
        visibleCollections.map((collection) => {
          const rows: CollectionRow[] = [...collection.collection_tickers]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((t) => {
              const info = enriched.get(t.ticker.toUpperCase());
              const quote = info?.quote;
              return {
                ticker: t.ticker,
                price: quote?.price ?? null,
                currency: quote?.currency ?? null,
                yieldPct: getYieldPct(quote),
                name: info?.name ?? null,
                logoUrl: info?.logoUrl ?? null,
                changePercent: quote?.changePercent ?? null,
                sparkline: info?.sparkline ?? [],
              };
            });

          const style = getCategoryStyle(collection.category);
          const CategoryIcon = style.icon;

          return (
            <div key={collection.id} className="min-w-0 flex flex-col gap-sp-2">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", style.chipClass)}>
                  <CategoryIcon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-h2 font-display font-medium text-text-primary">{collection.name}</h2>
                  {collection.description ? (
                    <p className="text-sm text-text-secondary">{collection.description}</p>
                  ) : null}
                </div>
                <Link
                  href={`/collections/${collection.id}`}
                  className="shrink-0 font-mono text-xs text-green-500 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <CollectionTable rows={rows} />
            </div>
          );
        })
      )}
    </div>
  );
}
