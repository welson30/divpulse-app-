"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { watchTicker } from "@/app/(dashboard)/watchlist/actions";

export type CollectionRow = {
  ticker: string;
  price: number | null;
  currency: string | null;
  yieldPct: number | null;
};

function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(price);
}

function formatYield(yieldPct: number | null) {
  if (yieldPct == null) return "—";
  return `${(yieldPct * 100).toFixed(2)}%`;
}

export function CollectionTable({ rows }: { rows: CollectionRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState<Set<string>>(new Set());

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Ticker
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Price
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Yield
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isWatched = watched.has(row.ticker);
            return (
              <tr key={row.ticker} className={i === rows.length - 1 ? "" : "border-b border-border-subtle"}>
                <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">{row.ticker}</td>
                <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">
                  {formatPrice(row.price, row.currency)}
                </td>
                <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-green-500">
                  {formatYield(row.yieldPct)}
                </td>
                <td className="px-sp-3 py-3.5 text-right">
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
