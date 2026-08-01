"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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
    <>
      {/* Mobile: a single-column row list — a wide table forces horizontal
          scroll on a 375-430px phone no matter how it's tuned, so below
          `lg:` this is a different layout entirely, not a shrunk table. */}
      <div className="flex flex-col gap-2 lg:hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 rounded-card border border-border-subtle bg-surface p-sp-3">
            <Link href={`/tickers/${item.ticker}`} className="flex min-w-0 flex-1 items-center gap-2.5">
              <TickerLogo ticker={item.ticker} logoUrl={item.logoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-semibold text-text-primary">{item.ticker}</div>
                <div className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                  {item.name ?? item.company_name ?? "—"}
                </div>
              </div>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">{formatMoney(item.price)}</span>
              <ChangeBadge changePercent={item.changePercent ?? null} className="text-xs" />
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeWatchlistItem(item.id))}
              aria-label="Remove"
              className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Desktop: full table, every column. */}
      <div className="hidden w-full overflow-x-auto overflow-y-hidden rounded-card border border-border-subtle bg-surface lg:block">
        <table className="w-full min-w-205 border-collapse">
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
                  <Link href={`/tickers/${item.ticker}`} className="flex items-center gap-2.5">
                    <TickerLogo ticker={item.ticker} logoUrl={item.logoUrl} />
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold text-text-primary">{item.ticker}</div>
                      <div className="mt-0.5 max-w-55 truncate text-xs text-text-secondary">
                        {item.name ?? item.company_name ?? "—"}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-primary">
                  {formatMoney(item.price)}
                </td>
                <td className="px-sp-3 py-3 text-right text-sm">
                  <ChangeBadge changePercent={item.changePercent ?? null} />
                </td>
                <td className="px-sp-3 py-3">
                  <div className="flex justify-center">
                    <Sparkline points={item.sparkline ?? []} id={`wl-${item.id}`} changePercent={item.changePercent ?? null} />
                  </div>
                </td>
                <td className="px-sp-3 py-3">
                  <RangeBar low={item.fiftyTwoWeekLow} high={item.fiftyTwoWeekHigh} current={item.price} className="min-w-30" />
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
    </>
  );
}
