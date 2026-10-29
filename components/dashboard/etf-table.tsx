"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Check, Loader2, Plus, TrendingUp, BarChart2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { watchTicker } from "@/app/(dashboard)/watchlist/actions";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import type { SparklinePoint } from "@/lib/dividend-data/types";
import type { PayFrequency } from "@/lib/etf-explorer/curated-lists";
import { NAV_DECAY_RISK_TICKERS } from "@/lib/etf-explorer/curated-lists";

export type EtfRow = {
  ticker: string;
  price: number | null;
  currency: string | null;
  yieldPct: number | null;
  name?: string | null;
  logoUrl?: string | null;
  changePercent?: number | null;
  sparkline?: SparklinePoint[];
  frequency?: PayFrequency | null;
};

function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatYield(yieldPct: number | null) {
  if (yieldPct == null) return "—";
  return `${(yieldPct * 100).toFixed(2)}%`;
}

function annualIncome(invest: number, yieldPct: number | null): string | null {
  if (!yieldPct || !invest) return null;
  // yieldPct is already a decimal fraction (e.g. 0.0816 = 8.16%)
  const annual = invest * yieldPct;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(annual);
}

const FREQ_STYLES: Record<PayFrequency, { key: "monthly" | "weekly" | "quarterly"; bg: string; text: string; dot: string }> = {
  Monthly: {
    key: "monthly",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  Quarterly: {
    key: "quarterly",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  Weekly: {
    key: "weekly",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
};

function FreqBadge({ freq }: { freq: PayFrequency }) {
  const t = useTranslations("dashboard.etfExplorer");
  const s = FREQ_STYLES[freq];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${s.bg} ${s.text}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {t(s.key)}
    </span>
  );
}

const HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

type SortDir = "asc" | "desc" | null;

type Props = {
  rows: EtfRow[];
  investAmount?: number;
  compareMode?: boolean;
  selectedTickers?: string[];
  onToggleCompare?: (ticker: string) => void;
};

export function EtfTable({ rows, investAmount = 10000, compareMode, selectedTickers = [], onToggleCompare }: Props) {
  const [, startTransition] = useTransition();
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [pendingTicker, setPendingTicker] = useState<string | null>(null);
  const t = useTranslations("dashboard.etfExplorer");
  const [yieldSort, setYieldSort] = useState<SortDir>(null);

  const sortedRows = yieldSort
    ? [...rows].sort((a, b) => {
        const ya = a.yieldPct ?? -1;
        const yb = b.yieldPct ?? -1;
        return yieldSort === "desc" ? yb - ya : ya - yb;
      })
    : rows;

  function cycleYieldSort() {
    setYieldSort((prev) => (prev === null ? "desc" : prev === "desc" ? "asc" : null));
  }

  const handleWatch = (ticker: string) => {
    setPendingTicker(ticker);
    startTransition(async () => {
      try {
        await watchTicker(ticker, null);
        setWatched((prev: Set<string>) => new Set(prev).add(ticker));
      } finally {
        setPendingTicker(null);
      }
    });
  };

  return (
    <>
      {/* ── Mobile card list ── */}
      <div className="flex flex-col gap-2 lg:hidden">
        {rows.map((row) => {
          const isWatched = watched.has(row.ticker);
          const isSelected = selectedTickers.includes(row.ticker);
          const hasStaleYieldMobile = row.frequency === "Weekly" && (row.yieldPct ?? 0) < 0.05;
          return (
            <div
              key={row.ticker}
              className="flex flex-col gap-2 rounded-card border border-border-subtle bg-surface p-sp-3"
            >
              <div className="flex items-center gap-2.5">
                {compareMode && (
                  <button
                    type="button"
                    onClick={() => onToggleCompare?.(row.ticker)}
                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-border-interactive text-transparent hover:border-blue-500"
                    }`}
                  >
                    <Check className="size-3" />
                  </button>
                )}
                <Link href={`/tickers/${row.ticker}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                  <TickerLogo ticker={row.ticker} logoUrl={row.logoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold text-text-primary">{row.ticker}</span>
                      {row.frequency && <FreqBadge freq={row.frequency} />}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-text-secondary">{row.name ?? "—"}</div>
                  </div>
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                    {formatPrice(row.price, row.currency)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasStaleYieldMobile ? (
                    <span title="Yahoo Finance data unreliable — check fund site" className="inline-flex items-center gap-0.5 font-mono text-xs text-amber-400 cursor-help">
                      <AlertTriangle className="size-2.5" />N/A
                    </span>
                  ) : (
                    <span className="font-mono text-xs tabular-nums text-green-500">{formatYield(row.yieldPct)}</span>
                  )}
                    <ChangeBadge changePercent={row.changePercent ?? null} className="text-xs" />
                  </div>
                </div>
              </div>
              {/* Income estimate on mobile */}
              {investAmount > 0 && row.yieldPct && !hasStaleYieldMobile && (
                <div className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                  <span className="font-mono">
                    ${investAmount.toLocaleString()} invested →{" "}
                    <span className="font-semibold text-green-500">
                      {annualIncome(investAmount, row.yieldPct)}/yr
                    </span>
                  </span>
                </div>
              )}
              {investAmount > 0 && hasStaleYieldMobile && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 text-xs text-amber-400/80">
                  <span className="font-mono">{t("yieldUnreliableWarning")}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/holdings?ticker=${row.ticker}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-[11px] font-semibold text-text-primary transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Plus className="size-3" />
                  {t("actionAddToPortfolio")}
                </Link>
                {isWatched ? (
                  <Link
                    href="/watchlist"
                    aria-label={t("actionWatching")}
                    className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-sans text-[11px] font-semibold text-green-500 transition-colors hover:bg-green-500/20"
                  >
                    <Check className="size-3" />
                    {t("actionWatching")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={pendingTicker === row.ticker}
                    onClick={() => handleWatch(row.ticker)}
                    aria-label={t("actionWatch")}
                    className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-[11px] font-semibold text-text-primary transition-colors hover:border-green-500 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-40"
                  >
                    {pendingTicker === row.ticker ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <TrendingUp className="size-3" />
                    )}
                    {t("actionWatch")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden w-full overflow-x-auto overflow-y-hidden rounded-card border border-border-subtle bg-surface lg:block">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              {compareMode && (
                <th className={`${HEAD} w-14 text-center`}>
                  <span className="inline-flex flex-col items-center gap-0.5">
                    <BarChart2 className="size-3 text-blue-400" />
                    <span className="text-[9px]">{t("colCompare")}</span>
                  </span>
                </th>
              )}
              <th className={`${HEAD} text-left`}>{t("colAsset")}</th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">
                  {t("colPrice")} <InfoTip label={TIPS.todayChange} />
                </span>
              </th>
              <th className={`${HEAD} text-center w-20`}>
                <span className="inline-flex items-center gap-1">
                  {t("col1M")} <InfoTip label={TIPS.sparkline1M} />
                </span>
              </th>
              <th className={`${HEAD} text-right`}>
                <button
                  type="button"
                  onClick={cycleYieldSort}
                  className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  title="Sort by yield"
                >
                  {t("colYield")}
                  {yieldSort === null && <ArrowUpDown className="size-3 opacity-40" />}
                  {yieldSort === "desc" && <ArrowDown className="size-3 text-green-400" />}
                  {yieldSort === "asc" && <ArrowUp className="size-3 text-green-400" />}
                  <InfoTip label={TIPS.dividendYield} />
                </button>
              </th>
              {investAmount > 0 && (
                <th className={`${HEAD} text-right`}>
                  <span className="inline-flex items-center gap-1">
                    {t("colIncomeEst", { amount: investAmount.toLocaleString() })}
                    <InfoTip label="Estimated annual income based on current yield. Weekly ETF yields may show lower than actual — data providers sometimes underreport new funds." />
                  </span>
                </th>
              )}
              <th className={`${HEAD} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const isWatched = watched.has(row.ticker);
              const isSelected = selectedTickers.includes(row.ticker);
              const income = annualIncome(investAmount, row.yieldPct);
              const hasRisk = NAV_DECAY_RISK_TICKERS.has(row.ticker);
              // Yahoo Finance returns bad yield data for Roundhill 0DTE ETFs (QDTE, XDTE, RDTE)
              // and FEPI — weekly funds where dividendYieldPercent is often < 5% when real yield is 40-80%+
              const hasStaleYield = row.frequency === "Weekly" && (row.yieldPct ?? 0) < 0.05;
              return (
                <tr
                  key={row.ticker}
                  className={`transition-colors hover:bg-surface-hover ${
                    isSelected ? "bg-blue-500/5" : ""
                  } ${i === sortedRows.length - 1 ? "" : "border-b border-border-subtle"}`}
                >
                  {compareMode && (
                    <td className="px-sp-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleCompare?.(row.ticker)}
                        title="Select to compare"
                        className={`mx-auto flex size-5 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-border-interactive text-transparent hover:border-blue-500"
                        }`}
                      >
                        <Check className="size-3" />
                      </button>
                    </td>
                  )}
                  <td className="px-sp-3 py-3">
                    <Link href={`/tickers/${row.ticker}`} className="flex items-center gap-2.5">
                      <TickerLogo ticker={row.ticker} logoUrl={row.logoUrl} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-semibold text-text-primary">{row.ticker}</span>
                          {hasRisk && (
                            <span
                              title="Covered-call / options strategy — high yield may come with NAV decay over time. Review before investing."
                              className="inline-flex cursor-help items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-400 uppercase tracking-wide"
                            >
                              <AlertTriangle className="size-2.5" />
                              {t("navRisk")}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 max-w-72 truncate text-xs text-text-secondary">{row.name ?? "—"}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-sp-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-sm tabular-nums text-text-primary">
                        {formatPrice(row.price, row.currency)}
                      </span>
                      <ChangeBadge changePercent={row.changePercent ?? null} />
                    </div>
                  </td>
                  <td className="px-sp-3 py-3">
                    <div className="flex justify-center">
                      <Sparkline
                        points={row.sparkline ?? []}
                        id={`etf-${row.ticker}`}
                        changePercent={row.changePercent ?? null}
                      />
                    </div>
                  </td>
                  <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums">
                    {hasStaleYield ? (
                      <span
                        title="Yahoo Finance reports incorrect yield for this ETF. Check the fund's official site for actual distribution rate."
                        className="inline-flex cursor-help items-center gap-1 text-amber-400"
                      >
                        <AlertTriangle className="size-3" />
                        N/A
                      </span>
                    ) : (
                      <span className="text-green-500">{formatYield(row.yieldPct)}</span>
                    )}
                  </td>
                  {investAmount > 0 && (
                    <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums">
                      {hasStaleYield ? (
                        <span
                          title="Yield data unreliable for this ETF — check fund site for real distribution."
                          className="cursor-help text-amber-400/60 text-xs"
                        >
                          {t("yieldStale")}
                        </span>
                      ) : income ? (
                        <span className="text-green-400">{income}</span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-sp-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/holdings?ticker=${row.ticker}`}
                        title="Add to Portfolio"
                        className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-xs font-semibold text-text-primary transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                      >
                        <Plus className="size-3" />
                        {t("actionAdd")}
                      </Link>
                      {isWatched ? (
                        <Link
                          href="/watchlist"
                          className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-sans text-xs font-semibold text-green-500 transition-colors hover:bg-green-500/20"
                        >
                          <Check className="size-3.5" />
                          {t("actionWatching")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={pendingTicker === row.ticker}
                          onClick={() => handleWatch(row.ticker)}
                          className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-xs font-semibold text-text-primary transition-colors hover:border-green-500 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-40"
                        >
                          {pendingTicker === row.ticker ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <TrendingUp className="size-3.5" />
                          )}
                          {t("actionWatch")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
