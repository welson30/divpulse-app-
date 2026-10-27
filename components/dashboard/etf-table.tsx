"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Plus, TrendingUp, BarChart2 } from "lucide-react";
import { watchTicker } from "@/app/(dashboard)/watchlist/actions";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import type { SparklinePoint } from "@/lib/dividend-data/types";
import type { PayFrequency } from "@/lib/etf-explorer/curated-lists";

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

const FREQ_STYLES: Record<PayFrequency, { label: string; bg: string; text: string; dot: string }> = {
  Monthly: {
    label: "Monthly",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  Quarterly: {
    label: "Quarterly",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  Weekly: {
    label: "Weekly",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
};

function FreqBadge({ freq }: { freq: PayFrequency }) {
  const s = FREQ_STYLES[freq];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${s.bg} ${s.text}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

const HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

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
                    <span className="font-mono text-xs tabular-nums text-green-500">{formatYield(row.yieldPct)}</span>
                    <ChangeBadge changePercent={row.changePercent ?? null} className="text-xs" />
                  </div>
                </div>
              </div>
              {/* Income estimate on mobile */}
              {investAmount > 0 && row.yieldPct && (
                <div className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                  <span className="font-mono">
                    ${investAmount.toLocaleString()} invested →{" "}
                    <span className="font-semibold text-green-500">
                      {annualIncome(investAmount, row.yieldPct)}/yr
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/holdings?ticker=${row.ticker}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-[11px] font-semibold text-text-primary transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Plus className="size-3" />
                  Portfolio
                </Link>
                {isWatched ? (
                  <Link
                    href="/watchlist"
                    aria-label="Watching"
                    className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-sans text-[11px] font-semibold text-green-500 transition-colors hover:bg-green-500/20"
                  >
                    <Check className="size-3" />
                    Watching
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={pendingTicker === row.ticker}
                    onClick={() => handleWatch(row.ticker)}
                    aria-label="Watch"
                    className="inline-flex items-center gap-1 rounded-full border border-border-interactive px-2.5 py-1 font-sans text-[11px] font-semibold text-text-primary transition-colors hover:border-green-500 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-40"
                  >
                    {pendingTicker === row.ticker ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <TrendingUp className="size-3" />
                    )}
                    Watch
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden w-full overflow-x-auto overflow-y-hidden rounded-card border border-border-subtle bg-surface lg:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              {compareMode && <th className={`${HEAD} w-10`} />}
              <th className={`${HEAD} text-left`}>Asset</th>
              <th className={`${HEAD} text-left`}>Pays</th>
              <th className={`${HEAD} text-right`}>Price</th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">
                  Today <InfoTip label={TIPS.todayChange} />
                </span>
              </th>
              <th className={`${HEAD} text-center`}>
                <span className="inline-flex items-center gap-1">
                  1M <InfoTip label={TIPS.sparkline1M} />
                </span>
              </th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">
                  Yield <InfoTip label={TIPS.dividendYield} />
                </span>
              </th>
              {investAmount > 0 && (
                <th className={`${HEAD} text-right`}>
                  ${investAmount.toLocaleString()} → /yr
                </th>
              )}
              <th className={`${HEAD} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isWatched = watched.has(row.ticker);
              const isSelected = selectedTickers.includes(row.ticker);
              const income = annualIncome(investAmount, row.yieldPct);
              return (
                <tr
                  key={row.ticker}
                  className={`transition-colors hover:bg-surface-hover ${
                    isSelected ? "bg-blue-500/5" : ""
                  } ${i === rows.length - 1 ? "" : "border-b border-border-subtle"}`}
                >
                  {compareMode && (
                    <td className="px-sp-3 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleCompare?.(row.ticker)}
                        className={`flex size-5 items-center justify-center rounded border transition-colors ${
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
                        <div className="font-mono text-sm font-semibold text-text-primary">{row.ticker}</div>
                        <div className="mt-0.5 max-w-60 truncate text-xs text-text-secondary">{row.name ?? "—"}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-sp-3 py-3">
                    {row.frequency ? <FreqBadge freq={row.frequency} /> : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-primary">
                    {formatPrice(row.price, row.currency)}
                  </td>
                  <td className="px-sp-3 py-3 text-right text-sm">
                    <ChangeBadge changePercent={row.changePercent ?? null} />
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
                  <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-green-500">
                    {formatYield(row.yieldPct)}
                  </td>
                  {investAmount > 0 && (
                    <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums">
                      {income ? (
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
                        Add
                      </Link>
                      {isWatched ? (
                        <Link
                          href="/watchlist"
                          className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-sans text-xs font-semibold text-green-500 transition-colors hover:bg-green-500/20"
                        >
                          <Check className="size-3.5" />
                          Watching
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
                          Watch
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
