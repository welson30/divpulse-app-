"use client";

import { useState } from "react";
import { RemoveHoldingDialog } from "@/components/dashboard/remove-holding-dialog";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
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

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr>
            <th className={`${HEAD} text-left`}>Holding</th>
            <th className={`${HEAD} text-left`}>Broker</th>
            <th className={`${HEAD} text-right`}>Shares</th>
            <th className={`${HEAD} text-right`}>Price</th>
            <th className={`${HEAD} text-right`}>Today</th>
            <th className={`${HEAD} text-center`}>1M</th>
            <th className={`${HEAD} text-right`}>Value</th>
            <th className={`${HEAD} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, i) => (
            <tr
              key={holding.id}
              className={`transition-colors hover:bg-surface-hover ${i === holdings.length - 1 ? "" : "border-b border-border-subtle"}`}
            >
              <td className="px-sp-3 py-3">
                <div className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</div>
                <div className="mt-0.5 max-w-[220px] truncate text-xs text-text-secondary">
                  {holding.name ?? holding.company_name ?? "—"}
                </div>
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
                  <Sparkline
                    points={holding.sparkline ?? []}
                    id={holding.id}
                    changePercent={holding.changePercent ?? null}
                  />
                </div>
              </td>
              <td className="px-sp-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-text-primary">
                {formatMoney(holding.marketValue)}
              </td>
              <td className="px-sp-3 py-3 text-right">
                <button
                  type="button"
                  onClick={() => setPendingRemoval(holding)}
                  className="font-sans text-xs text-text-secondary transition-colors hover:text-red-500"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RemoveHoldingDialog
        holdingId={pendingRemoval?.id ?? null}
        ticker={pendingRemoval?.ticker ?? ""}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      />
    </div>
  );
}
