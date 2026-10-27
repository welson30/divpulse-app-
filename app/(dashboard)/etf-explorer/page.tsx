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
      {/*
        overflow-hidden is intentionally removed from the outer div so the search
        dropdown is NOT clipped. The glow orbs live in their own overflow-hidden
        container so they still respect the card boundary.
      */}
      <div className="relative rounded-[18px] border border-[#1c2028] bg-[#0b0e12] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)] lg:p-8">
        {/* Glow orbs — clipped to card only, not the dropdown */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-[#3fbf87] opacity-[0.05] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 size-56 rounded-full bg-[#60a5fa] opacity-[0.04] blur-3xl" />
          <div className="absolute left-1/2 top-0 size-48 rounded-full bg-[#a78bfa] opacity-[0.03] blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-4">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.08)] px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-[#60a5fa] uppercase">
              Discover
            </span>
            <h1 className="font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#e8eaf0] min-[900px]:text-[32px]">ETF Explorer</h1>
            <p className="mt-1.5 max-w-xl text-[14px] leading-[22.75px] text-[#3d4554]">
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
            <span className="font-mono text-[12px] text-[#3d4554]">Pay frequency:</span>
            <FreqPill color="bg-[#60a5fa]" label="Monthly" />
            <FreqPill color="bg-[#f59e0b]" label="Weekly" />
            <FreqPill color="bg-[#a78bfa]" label="Quarterly" />
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
    <span className="flex items-center gap-1.5 font-mono text-[12px] text-[#3d4554]">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
