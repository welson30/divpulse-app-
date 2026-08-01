"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { RemoveHoldingDialog } from "@/components/dashboard/remove-holding-dialog";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import { isLinkableTicker } from "@/lib/tickers/validate";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export type Holding = {
  id: string;
  ticker: string;
  company_name: string | null;
  broker_name: string | null;
  shares: number;
  source: "manual" | "csv" | "plaid";
  /** Resolved from the live quote, falling back to whatever the user typed. */
  name?: string | null;
  logoUrl?: string | null;
  price?: number | null;
  changePercent?: number | null;
  marketValue?: number | null;
  sparkline?: SparklinePoint[];
};

function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const [pendingRemoval, setPendingRemoval] = useState<Holding | null>(null);

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
        <p className="text-sm text-text-secondary">No holdings yet. Add a ticker to start tracking dividend income.</p>
      </div>
    );
  }

  // Delisted tickers, expired option contracts and non-traded instruments
  // (collective trusts, some retirement portfolios) resolve to a name but
  // carry no market data anywhere. Saying so beats printing bare dashes,
  // which reads as a failure rather than an accurate "nothing to show".
  // Plaid-synced accounts can carry options/futures positions whose OCC-
  // format symbols (e.g. "NFLX180201C00355000") run well past the
  // ticker-detail route's 10-character limit — linking to /tickers/[x]
  // for those is a guaranteed 404, so they render as plain (non-clickable)
  // rows instead, same treatment as "No market data" below.
  const rows = holdings.map((h) => ({
    ...h,
    hasMarketData: h.price != null || (h.sparkline?.length ?? 0) > 0,
    linkable: isLinkableTicker(h.ticker),
  }));

  return (
    <>
      {/* Mobile: a single-column row list — a wide table forces horizontal
          scroll on a 375-430px phone no matter how it's tuned, so below
          `lg:` this is a different layout entirely, not a shrunk table. */}
      <div className="flex flex-col gap-2 lg:hidden">
        {rows.map((holding) => {
          const rowInner = (
            <>
              <TickerLogo ticker={holding.ticker} logoUrl={holding.logoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</div>
                {holding.hasMarketData ? (
                  <div className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                    {holding.shares} sh · {formatMoney(holding.price)}
                  </div>
                ) : (
                  <div className="mt-1 inline-flex items-center rounded-[5px] bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-secondary">
                    No market data
                  </div>
                )}
              </div>
            </>
          );
          return (
          <div
            key={holding.id}
            className="flex items-center gap-2.5 rounded-card border border-border-subtle bg-surface p-sp-3"
          >
            {holding.linkable ? (
              <Link href={`/tickers/${holding.ticker}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                {rowInner}
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2.5">{rowInner}</div>
            )}
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                {formatMoney(holding.marketValue)}
              </span>
              <ChangeBadge changePercent={holding.changePercent ?? null} className="text-xs" />
            </div>
            <button
              type="button"
              onClick={() => setPendingRemoval(holding)}
              aria-label="Remove"
              className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          );
        })}
      </div>

      {/* Desktop: full table, every column. */}
      <div className="hidden w-full overflow-x-auto overflow-y-hidden rounded-card border border-border-subtle bg-surface lg:block">
        <table className="w-full min-w-215 border-collapse">
          <thead>
            <tr>
              <th className={`${HEAD} text-left`}>Holding</th>
              <th className={`${HEAD} text-left`}>Broker</th>
              <th className={`${HEAD} text-right`}>Shares</th>
              <th className={`${HEAD} text-right`}>Price</th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">Today <InfoTip label={TIPS.todayChange} /></span>
              </th>
              <th className={`${HEAD} text-center`}>
                <span className="inline-flex items-center gap-1">1M <InfoTip label={TIPS.sparkline1M} /></span>
              </th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">Value <InfoTip label={TIPS.marketValue} /></span>
              </th>
              <th className={`${HEAD} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((holding, i) => {
              const rowInner = (
                <>
                  <TickerLogo ticker={holding.ticker} logoUrl={holding.logoUrl} />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</div>
                    <div className="mt-0.5 max-w-55 truncate text-xs text-text-secondary">
                      {holding.name ?? holding.company_name ?? "—"}
                    </div>
                    {holding.hasMarketData ? null : (
                      <div className="mt-1 inline-flex items-center rounded-[5px] bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-secondary">
                        No market data
                      </div>
                    )}
                  </div>
                </>
              );
              return (
              <tr
                key={holding.id}
                className={`transition-colors hover:bg-surface-hover ${i === rows.length - 1 ? "" : "border-b border-border-subtle"}`}
              >
                <td className="px-sp-3 py-3">
                  {holding.linkable ? (
                    <Link href={`/tickers/${holding.ticker}`} className="flex items-center gap-2.5">
                      {rowInner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5">{rowInner}</div>
                  )}
                </td>
                <td className="px-sp-3 py-3 text-[13px] text-text-secondary">{holding.broker_name ?? "—"}</td>
                <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-primary">
                  {holding.shares}
                </td>
                <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-primary">
                  {formatMoney(holding.price)}
                </td>
                <td className="px-sp-3 py-3 text-right text-sm">
                  <ChangeBadge changePercent={holding.changePercent ?? null} />
                </td>
                <td className="px-sp-3 py-3">
                  <div className="flex justify-center">
                    <Sparkline points={holding.sparkline ?? []} id={holding.id} changePercent={holding.changePercent ?? null} />
                  </div>
                </td>
                <td className="px-sp-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {formatMoney(holding.marketValue)}
                </td>
                <td className="px-sp-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setPendingRemoval(holding)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 font-sans text-xs font-medium text-text-secondary transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RemoveHoldingDialog
        holdingId={pendingRemoval?.id ?? null}
        ticker={pendingRemoval?.ticker ?? ""}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      />
    </>
  );
}
