import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WatchlistTable, type WatchlistItem } from "@/components/dashboard/watchlist-table";
import { AddWatchlistDialog } from "@/components/dashboard/add-watchlist-dialog";

export const metadata: Metadata = {
  title: "Watchlist — PaidPrime",
};

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("watchlist_items")
    .select("id, ticker, company_name")
    .eq("user_id", user!.id)
    .order("added_at", { ascending: false });

  const count = items?.length ?? 0;

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap items-center justify-between gap-sp-2">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Watchlist</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {count} {count === 1 ? "ticker" : "tickers"} watched
          </p>
        </div>
        <AddWatchlistDialog />
      </div>

      <WatchlistTable items={(items ?? []) as WatchlistItem[]} />
    </div>
  );
}
