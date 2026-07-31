"use client";

import { useTransition } from "react";
import { removeWatchlistItem } from "@/app/(dashboard)/watchlist/actions";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import { RangeBar } from "@/components/dashboard/market-stats";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export type WatchlistItem = {
  id: string;
  ticker: string;
  company_name: string | null;
  name?: string | null;
  logoUrl?: string | null;
  price?: number | null;
  changePercent?: number | null;
  sparkline?: SparklinePoint[];
  fiftyTwoWeekLow?: number | null;
  fiftyTwoWeekHigh?: number | null;
};

function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
        <p className="text-sm text-text-secondary">
          Nothing watched yet. Add a ticker you&rsquo;re considering — no need to own it first.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
      <table className="w-full min-w-[820px] border-collapse">
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
            <th className={`${HEAD} text-left`}>
              <span className="inline-flex items-center gap-1">52-week range <InfoTip label={TIPS.fiftyTwoWeek} /></span>
            </th>
            <th className={`${HEAD} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={`transition-colors hover:bg-surface-hover ${i === items.length - 1 ? "" : "border-b border-border-subtle"}`}
            >
              <td className="px-sp-3 py-3">
                <div className="flex items-center gap-2.5">
                  <TickerLogo ticker={item.ticker} logoUrl={item.logoUrl} />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-text-primary">{item.ticker}</div>
                    <div className="mt-0.5 max-w-[220px] truncate text-xs text-text-secondary">
                      {item.name ?? item.company_name ?? "—"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-primary">
                {formatMoney(item.price)}
              </td>
              <td className="px-sp-3 py-3 text-right text-sm">
                <ChangeBadge changePercent={item.changePercent ?? null} />
              </td>
              <td className="px-sp-3 py-3">
                <div className="flex justify-center">
                  <Sparkline
                    points={item.sparkline ?? []}
                    id={`wl-${item.id}`}
                    changePercent={item.changePercent ?? null}
                  />
                </div>
              </td>
              <td className="px-sp-3 py-3">
                <RangeBar
                  low={item.fiftyTwoWeekLow}
                  high={item.fiftyTwoWeekHigh}
                  current={item.price}
                  className="min-w-[120px]"
                />
              </td>
              <td className="px-sp-3 py-3 text-right">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => removeWatchlistItem(item.id))}
                  className="font-sans text-xs text-text-secondary transition-colors hover:text-red-500 disabled:opacity-40"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
