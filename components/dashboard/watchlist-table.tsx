"use client";

import { useTransition } from "react";
import { removeWatchlistItem } from "@/app/(dashboard)/watchlist/actions";

export type WatchlistItem = {
  id: string;
  ticker: string;
  company_name: string | null;
};

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
      <table className="w-full min-w-[420px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Ticker
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              Company
            </th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className={i === items.length - 1 ? "" : "border-b border-border-subtle"}>
              <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">{item.ticker}</td>
              <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{item.company_name ?? "—"}</td>
              <td className="px-sp-3 py-3.5 text-right">
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
