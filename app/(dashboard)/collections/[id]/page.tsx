import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hash, Star, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { getCategoryStyle } from "@/components/dashboard/collection-category-style";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";
import { StatCard } from "@/components/dashboard/market-stats";
import { cn } from "@/lib/utils";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CollectionDetailPageProps = { params: Promise<{ id: string }> };

async function getCollection(id: string) {
  const supabase = await createClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, category, description, collection_tickers(ticker, sort_order)")
    .eq("id", id)
    .maybeSingle();
  return collection;
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return { title: "Collections — PaidPrime" };
  const collection = await getCollection(id);
  return { title: collection ? `${collection.name} — PaidPrime` : "Collections — PaidPrime" };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const collection = await getCollection(id);
  if (!collection) {
    notFound();
  }

  const tickers = [...collection.collection_tickers].sort((a, b) => a.sort_order - b.sort_order);
  const enriched = await enrichTickers(tickers.map((t) => t.ticker));

  const rows: CollectionRow[] = tickers.map((t) => {
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

  let yieldSum = 0;
  let yieldCount = 0;
  let topTicker: string | null = null;
  let topChangePercent = -Infinity;
  for (const row of rows) {
    if (row.yieldPct != null) {
      yieldSum += row.yieldPct;
      yieldCount += 1;
    }
    if (row.changePercent != null && row.changePercent > topChangePercent) {
      topChangePercent = row.changePercent;
      topTicker = row.ticker;
    }
  }
  const avgYieldPct = yieldCount > 0 ? (yieldSum / yieldCount) * 100 : null;
  const hasTopPerformer = topTicker != null && topChangePercent > -Infinity;

  const style = getCategoryStyle(collection.category);
  const CategoryIcon = style.icon;

  return (
    <div className="min-w-0 flex flex-col gap-sp-4">
      <div>
        <Link
          href="/collections"
          className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to Collections
        </Link>
        <div className="flex items-center gap-3">
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", style.chipClass)}>
            <CategoryIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="mb-0.5 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
              {collection.category}
            </span>
            <h1 className="text-h1 font-display font-semibold text-text-primary">{collection.name}</h1>
          </div>
        </div>
        {collection.description ? <p className="mt-2 text-sm text-text-secondary">{collection.description}</p> : null}
      </div>

      <div className="grid grid-cols-3 items-start gap-sp-2">
        <StatCard label="Tickers" value={String(rows.length)} icon={Hash} compact />
        <StatCard
          label="Average Yield"
          value={avgYieldPct != null ? `${avgYieldPct.toFixed(2)}%` : "—"}
          icon={TrendingUp}
          compact
        />
        <StatCard
          label="Top Performer (1D)"
          value={topTicker ?? "—"}
          changePercent={hasTopPerformer ? topChangePercent : undefined}
          sub={hasTopPerformer ? undefined : "No data yet"}
          sparkline={hasTopPerformer ? rows.find((r) => r.ticker === topTicker)?.sparkline : undefined}
          icon={Star}
          compact
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">No tickers in this collection yet.</p>
        </div>
      ) : (
        <CollectionTable rows={rows} />
      )}
    </div>
  );
}
