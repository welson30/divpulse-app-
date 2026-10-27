import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { getCuratedListById, CURATED_LISTS } from "@/lib/etf-explorer/curated-lists";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = getCuratedListById(id);
  if (!list) return { title: "ETF List — PaidPrime" };
  return { title: `${list.title} — PaidPrime` };
}

export function generateStaticParams() {
  return CURATED_LISTS.map((l) => ({ id: l.id }));
}

export const revalidate = 300;

export default async function EtfListPage({ params }: Props) {
  const { id } = await params;
  const list = getCuratedListById(id);
  if (!list) return notFound();

  const enriched = await enrichTickers(list.tickers, "1mo");

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
    <div className="flex flex-col gap-sp-6">
      {/* Back link */}
      <Link
        href="/etf-explorer"
        className="flex w-fit items-center gap-1 font-mono text-xs text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        ETF Explorer
      </Link>

      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
          Curated list
        </span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">{list.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{list.description}</p>
      </div>

      <CollectionTable rows={rows} />
    </div>
  );
}
