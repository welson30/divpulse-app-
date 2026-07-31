"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { watchTicker } from "@/app/(dashboard)/watchlist/actions";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { InfoTip, TIPS } from "@/components/dashboard/info-tip";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export type CollectionRow = {
  ticker: string;
  price: number | null;
  currency: string | null;
  yieldPct: number | null;
  name?: string | null;
  logoUrl?: string | null;
  changePercent?: number | null;
  sparkline?: SparklinePoint[];
};

function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(price);
}

function formatYield(yieldPct: number | null) {
  if (yieldPct == null) return "—";
  return `${(yieldPct * 100).toFixed(2)}%`;
}

const HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

export function CollectionTable({ rows }: { rows: CollectionRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState<Set<string>>(new Set());

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th className={`${HEAD} text-left`}>Asset</th>
            <th className={`${HEAD} text-right`}>Price</th>
            <th className={`${HEAD} text-right`}>
              <span className="inline-flex items-center gap-1">Today <InfoTip label={TIPS.todayChange} /></span>
            </th>
            <th className={`${HEAD} text-center`}>
              <span className="inline-flex items-center gap-1">1M <InfoTip label={TIPS.sparkline1M} /></span>
            </th>
            <th className={`${HEAD} text-right`}>
              <span className="inline-flex items-center gap-1">Yield <InfoTip label={TIPS.dividendYield} /></span>
            </th>
            <th className={`${HEAD} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isWatched = watched.has(row.ticker);
            return (
              <tr
                key={row.ticker}
                className={`transition-colors hover:bg-surface-hover ${i === rows.length - 1 ? "" : "border-b border-border-subtle"}`}
              >
                <td className="px-sp-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <TickerLogo ticker={row.ticker} logoUrl={row.logoUrl} />
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold text-text-primary">{row.ticker}</div>
                      <div className="mt-0.5 max-w-[240px] truncate text-xs text-text-secondary">{row.name ?? "—"}</div>
                    </div>
                  </div>
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
                      id={`col-${row.ticker}`}
                      changePercent={row.changePercent ?? null}
                    />
                  </div>
                </td>
                <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-green-500">
                  {formatYield(row.yieldPct)}
                </td>
                <td className="px-sp-3 py-3 text-right">
                  {isWatched ? (
                    <Link
                      href="/watchlist"
                      className="font-sans text-xs text-green-500 underline decoration-green-500/40 underline-offset-2 transition-colors hover:decoration-green-500"
                    >
                      Watching · view list
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await watchTicker(row.ticker, null);
                          setWatched((prev) => new Set(prev).add(row.ticker));
                        })
                      }
                      className="font-sans text-xs text-text-secondary transition-colors hover:text-green-500 disabled:opacity-40"
                    >
                      Watch
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
