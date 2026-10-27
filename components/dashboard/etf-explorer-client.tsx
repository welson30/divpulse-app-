"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, X } from "lucide-react";
import { EtfTable, type EtfRow } from "@/components/dashboard/etf-table";
import { EtfYieldCalculator } from "@/components/dashboard/etf-yield-calculator";
import type { CuratedList } from "@/lib/etf-explorer/curated-lists";

type ListWithRows = CuratedList & { rows: EtfRow[] };

type Props = {
  lists: ListWithRows[];
};

export function EtfExplorerClient({ lists }: Props) {
  const [investAmount, setInvestAmount] = useState(10_000);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleCompare(ticker: string) {
    setSelected((prev: string[]) => {
      if (prev.includes(ticker)) return prev.filter((t: string) => t !== ticker);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, ticker];
    });
  }

  const compareHref = `/etf-explorer/compare?tickers=${selected.join(",")}`;

  return (
    <div className="flex flex-col gap-sp-6">
      {/* ── Yield calculator ── */}
      <EtfYieldCalculator onAmountChange={setInvestAmount} initialAmount={investAmount} />

      {/* ── Compare bar (sticky when items selected) ── */}
      {selected.length > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-[#0d1117] px-4 py-3 shadow-xl shadow-black/40 backdrop-blur">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-blue-400" />
            <span className="text-sm font-semibold text-text-primary">
              {selected.length} ETF{selected.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-1">
              {selected.map((t: string) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-blue-400"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => toggleCompare(t)}
                    className="hover:text-blue-200"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected.length >= 2 && (
              <Link
                href={compareHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 font-sans text-xs font-semibold text-white transition-colors hover:bg-blue-400"
              >
                <BarChart2 className="size-3.5" />
                Compare selected
              </Link>
            )}
            {selected.length < 2 && (
              <span className="font-mono text-xs text-text-secondary">Select {2 - selected.length} more</span>
            )}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="font-mono text-xs text-text-secondary hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Curated list sections ── */}
      <div className="flex flex-col gap-sp-8">
        {lists.map((list) => (
          <section key={list.id}>
            <div className="mb-sp-3 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-h2 font-display font-semibold text-text-primary">{list.title}</h2>
                  <FreqTag freq={list.frequency} />
                </div>
                <p className="text-sm text-text-secondary">{list.description}</p>
              </div>
              <Link
                href={`/etf-explorer/list/${list.id}`}
                className="shrink-0 font-mono text-xs text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <EtfTable
              rows={list.rows}
              investAmount={investAmount}
              compareMode={true}
              selectedTickers={selected}
              onToggleCompare={toggleCompare}
            />
          </section>
        ))}
      </div>

      {/* Compare CTA hint when nothing selected */}
      {selected.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface p-4 text-sm text-text-secondary">
          <BarChart2 className="size-4 shrink-0 text-blue-400" />
          <span>
            Tip: check the boxes next to any ETFs to compare them side by side.{" "}
            <Link href="/etf-explorer/compare?tickers=JEPI,SCHD,O" className="text-blue-400 underline underline-offset-2">
              Try a demo comparison →
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}

function FreqTag({ freq }: { freq: string }) {
  const styles: Record<string, string> = {
    Monthly: "bg-blue-500/10 text-blue-400",
    Quarterly: "bg-violet-500/10 text-violet-400",
    Weekly: "bg-amber-500/10 text-amber-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${styles[freq] ?? "bg-surface-hover text-text-secondary"}`}
    >
      {freq}
    </span>
  );
}
