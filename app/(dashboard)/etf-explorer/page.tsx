import type { Metadata } from "next";
import Link from "next/link";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { CURATED_LISTS, TICKER_FREQUENCY } from "@/lib/etf-explorer/curated-lists";
import { EtfExplorerClient } from "@/components/dashboard/etf-explorer-client";
import { EtfSearch } from "@/components/dashboard/etf-search";
import type { EtfRow } from "@/components/dashboard/etf-table";

export const metadata: Metadata = {
  title: "ETF Explorer — PaidPrime",
};

export const revalidate = 300;

export default async function EtfExplorerPage() {
  // Collect all tickers across all curated lists and enrich in one batch.
  const allTickers = [...new Set(CURATED_LISTS.flatMap((l) => l.tickers))];
  const enriched = await enrichTickers(allTickers, "1mo");

  // Build row data per list
  const listsWithRows = CURATED_LISTS.map((list) => ({
    ...list,
    rows: list.tickers.map((ticker): EtfRow => {
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
    }),
  }));

  return (
    <div className="flex flex-col gap-sp-6">
      {/* ── Hero section ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-[#0e1116] via-[#111519] to-[#0a0d10] p-6 lg:p-8">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-56 rounded-full bg-green-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-blue-400 uppercase">
              Discover
            </span>
            <h1 className="text-h1 font-display font-semibold text-text-primary">ETF Explorer</h1>
            <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
              Curated dividend ETFs and REITs — browse by payment frequency, compare side-by-side, or calculate your
              expected annual income.
            </p>
          </div>

          {/* Search bar — z-50 so the dropdown floats above the cards below */}
          <div className="relative z-50">
            <EtfSearch />
          </div>

          {/* Frequency legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-text-secondary">Pay frequency:</span>
            <FreqPill color="bg-blue-400" label="Monthly" />
            <FreqPill color="bg-amber-400" label="Weekly" />
            <FreqPill color="bg-violet-400" label="Quarterly" />
          </div>
        </div>
      </div>

      {/* ── Client shell: calculator + compare + lists ── */}
      <EtfExplorerClient lists={listsWithRows} />
    </div>
  );
}

function FreqPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 font-mono text-xs text-text-secondary">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
