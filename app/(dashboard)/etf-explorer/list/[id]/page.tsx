import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { getCuratedListById, CURATED_LISTS, TICKER_FREQUENCY } from "@/lib/etf-explorer/curated-lists";
import { EtfTable, type EtfRow } from "@/components/dashboard/etf-table";

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

const FREQ_STYLES: Record<string, { pill: string; heading: string }> = {
  Monthly: { pill: "bg-blue-500/10 text-blue-400", heading: "text-blue-400" },
  Quarterly: { pill: "bg-violet-500/10 text-violet-400", heading: "text-violet-400" },
  Weekly: { pill: "bg-amber-500/10 text-amber-400", heading: "text-amber-400" },
};

export default async function EtfListPage({ params }: Props) {
  const { id } = await params;
  const list = getCuratedListById(id);
  if (!list) return notFound();

  const enriched = await enrichTickers(list.tickers, "1mo");

  const rows: EtfRow[] = list.tickers.map((ticker) => {
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
      frequency: TICKER_FREQUENCY[ticker] ?? null,
    };
  });

  const style = FREQ_STYLES[list.frequency] ?? { pill: "bg-surface-hover text-text-secondary", heading: "text-text-secondary" };

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

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="mb-0 font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Curated list</span>
          <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${style.pill}`}>
            {list.frequency}
          </span>
        </div>
        <h1 className="text-h1 font-display font-semibold text-text-primary">{list.title}</h1>
        <p className="text-sm text-text-secondary">{list.description}</p>
      </div>

      <EtfTable rows={rows} investAmount={10_000} />
    </div>
  );
}
