"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { watchTicker } from "@/app/(dashboard)/watchlist/actions";
import { AddHoldingDialog } from "@/components/dashboard/add-holding-dialog";
import { Button } from "@/components/ui/button";

type TickerDetailActionsProps = {
  ticker: string;
  companyName: string | null;
  initiallyWatched: boolean;
  defaultBroker?: string;
};

/**
 * Watch/Watching pill — same treatment as components/dashboard/collection-table.tsx's
 * row action, reused here rather than reinvented — plus "Add to holdings"
 * opening the same dialog used on /holdings, pre-filled with this ticker.
 */
export function TickerDetailActions({ ticker, companyName, initiallyWatched, defaultBroker }: TickerDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState(initiallyWatched);

  return (
    <div className="flex items-center gap-1.5">
      {watched ? (
        <Link
          href="/watchlist"
          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 font-sans text-xs font-semibold text-green-500 transition-all active:scale-[0.97] hover:bg-green-500/20 lg:h-11 lg:gap-1.5 lg:px-3.5 lg:text-sm"
        >
          <Star className="size-3.5 lg:size-4" fill="currentColor" />
          Watching
        </Link>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await watchTicker(ticker, companyName);
              setWatched(true);
            })
          }
          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border-interactive px-2.5 font-sans text-xs font-semibold text-text-primary transition-all active:scale-[0.97] hover:border-green-500 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-40 lg:h-11 lg:gap-1.5 lg:px-3.5 lg:text-sm"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin lg:size-4" /> : <Star className="size-3.5 lg:size-4" />}
          Watchlist
        </button>
      )}

      <AddHoldingDialog
        defaultTicker={ticker}
        defaultCompanyName={companyName ?? ""}
        defaultBroker={defaultBroker}
        trigger={
          <Button className="h-8 rounded-full px-2.5 text-xs transition-transform active:scale-[0.97] lg:h-11 lg:px-4 lg:text-sm">
            Add to holdings
          </Button>
        }
      />
    </div>
  );
}
