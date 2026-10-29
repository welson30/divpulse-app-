"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BarChart2, X, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { EtfTable, type EtfRow } from "@/components/dashboard/etf-table";
import { EtfYieldCalculator } from "@/components/dashboard/etf-yield-calculator";
import type { CuratedList } from "@/lib/etf-explorer/curated-lists";

type ListWithRows = CuratedList & { rows: EtfRow[] };

type Props = {
  lists: ListWithRows[];
};

const DEFAULT_VISIBLE = 6;

export function EtfExplorerClient({ lists }: Props) {
  const t = useTranslations("dashboard.etfExplorer");
  const [investAmount, setInvestAmount] = useState(10_000);
  const [selected, setSelected] = useState<string[]>([]);
  // Track how many rows to show per list ID
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(lists.map((l) => [l.id, DEFAULT_VISIBLE]))
  );

  function showMore(listId: string, total: number) {
    setVisibleCounts((prev: Record<string, number>) => ({
      ...prev,
      [listId]: Math.min((prev[listId] ?? DEFAULT_VISIBLE) + 10, total),
    }));
  }

  function showLess(listId: string) {
    setVisibleCounts((prev: Record<string, number>) => ({
      ...prev,
      [listId]: DEFAULT_VISIBLE,
    }));
  }

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

      {/* ── Compare CTA hint (visible BEFORE selecting, sits right below calc) ── */}
      {selected.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <BarChart2 className="size-4 shrink-0 text-blue-400" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-text-primary">{t("compareHint")}</span>
            <span className="text-xs text-text-secondary">
              {t("compareHintSub")}
            </span>
          </div>
          <Link
            href="/etf-explorer/compare?tickers=JEPI,SCHD,O"
            className="shrink-0 font-mono text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300"
          >
            {t("compareDemo")}
          </Link>
        </div>
      )}

      {/* ── Compare bar (sticky when items selected) ── */}
      {selected.length > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-[#0d1117] px-4 py-3 shadow-xl shadow-black/40 backdrop-blur">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-blue-400" />
            <span className="text-sm font-semibold text-text-primary">
              {t("compareSelected", { count: selected.length })}
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
                {t("compareButton")}
              </Link>
            )}
            {selected.length < 2 && (
              <span className="font-mono text-xs text-text-secondary">{t("compareSelectMore", { count: 2 - selected.length })}</span>
            )}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="font-mono text-xs text-text-secondary hover:text-text-primary"
            >
              {t("compareClear")}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-h2 font-display font-semibold text-text-primary">{list.title}</h2>
                  {list.isGrowth ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase text-emerald-400">
                      <TrendingUp className="size-2.5" />
                      {t("growthBadge")}
                    </span>
                  ) : (
                    <FreqTag freq={list.frequency} />
                  )}
                </div>
                <p className="text-sm text-text-secondary">{list.description}</p>
                {list.isGrowth && (
                  <p className="text-xs text-emerald-400/70 font-mono">
                    {t("growthTip")}
                  </p>
                )}
              </div>
            </div>
            {(() => {
              const visible = visibleCounts[list.id] ?? DEFAULT_VISIBLE;
              const visibleRows = list.rows.slice(0, visible);
              const remaining = list.rows.length - visible;
              const isExpanded = visible >= list.rows.length;
              return (
                <>
                  <EtfTable
                    rows={visibleRows}
                    investAmount={investAmount}
                    compareMode={true}
                    selectedTickers={selected}
                    onToggleCompare={toggleCompare}
                  />
                  {/* Show more / Show less controls */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="h-px flex-1 bg-border-subtle" />
                    {!isExpanded ? (
                      <button
                        type="button"
                        onClick={() => showMore(list.id, list.rows.length)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border-interactive px-4 py-1.5 font-mono text-xs font-medium text-text-secondary transition-colors hover:border-blue-500 hover:text-blue-400"
                      >
                        <ChevronDown className="size-3.5" />
                        {t("showMore", { count: Math.min(remaining, 10) })}
                        <span className="text-text-secondary opacity-60">
                          ({visible}/{list.rows.length})
                        </span>
                      </button>
                    ) : visible > DEFAULT_VISIBLE ? (
                      <button
                        type="button"
                        onClick={() => showLess(list.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border-interactive px-4 py-1.5 font-mono text-xs font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-text-primary"
                      >
                        <ChevronUp className="size-3.5" />
                        {t("showLess")}
                      </button>
                    ) : null}
                    <div className="h-px flex-1 bg-border-subtle" />
                    {list.rows.length > DEFAULT_VISIBLE && (
                      <Link
                        href={`/etf-explorer/list/${list.id}`}
                        className="font-mono text-xs text-text-secondary underline-offset-2 hover:text-blue-400 hover:underline"
                      >
                        {t("fullList")}
                      </Link>
                    )}
                  </div>
                </>
              );
            })()}
          </section>
        ))}
      </div>

    </div>
  );
}

function FreqTag({ freq }: { freq: string }) {
  const t = useTranslations("dashboard.etfExplorer");
  const styles: Record<string, string> = {
    Monthly: "bg-blue-500/10 text-blue-400",
    Quarterly: "bg-violet-500/10 text-violet-400",
    Weekly: "bg-amber-500/10 text-amber-400",
  };
  const labelKey: Record<string, "monthly" | "weekly" | "quarterly"> = {
    Monthly: "monthly",
    Weekly: "weekly",
    Quarterly: "quarterly",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${styles[freq] ?? "bg-surface-hover text-text-secondary"}`}
    >
      {labelKey[freq] ? t(labelKey[freq]) : freq}
    </span>
  );
}
