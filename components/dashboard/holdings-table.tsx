"use client";

import { useState } from "react";
import { RemoveHoldingDialog } from "@/components/dashboard/remove-holding-dialog";

export type Holding = {
  id: string;
  ticker: string;
  company_name: string | null;
  broker_name: string | null;
  shares: number;
  source: "manual" | "csv" | "plaid";
};

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
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Ticker
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Company
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Broker
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Shares
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, i) => (
            <tr key={holding.id} className={i === holdings.length - 1 ? "" : "border-b border-border-subtle"}>
              <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">{holding.ticker}</td>
              <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{holding.company_name ?? "—"}</td>
              <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{holding.broker_name ?? "—"}</td>
              <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">{holding.shares}</td>
              <td className="px-sp-3 py-3.5 text-right">
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
