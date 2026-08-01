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
};

/**
 * Watch/Watching pill — same treatment as components/dashboard/collection-table.tsx's
 * row action, reused here rather than reinvented — plus "Add to holdings"
 * opening the same dialog used on /holdings, pre-filled with this ticker.
 */
export function TickerDetailActions({ ticker, companyName, initiallyWatched }: TickerDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState(initiallyWatched);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {watched ? (
        <Link
          href="/watchlist"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3.5 font-sans text-sm font-semibold text-green-500 transition-all duration-150 active:scale-[0.97] hover:bg-green-500/20"
        >
          <Star className="size-4" fill="currentColor" />
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
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border-interactive px-3.5 font-sans text-sm font-semibold text-text-primary transition-all duration-150 active:scale-[0.97] hover:border-green-500 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />}
          Watchlist
        </button>
      )}

      <AddHoldingDialog
        defaultTicker={ticker}
        defaultCompanyName={companyName ?? ""}
        trigger={
          <Button className="h-11 rounded-full text-sm transition-transform duration-150 active:scale-[0.97]">
            Add to holdings
          </Button>
        }
      />
    </div>
  );
}
