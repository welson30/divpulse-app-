import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { TTM_WINDOW_DAYS } from "@/lib/dividend-data/income";
import { AddWatchlistForm } from "@/components/dashboard/add-watchlist-form";
import { WatchlistTable, type WatchlistItem } from "@/components/dashboard/watchlist-table";

export const metadata: Metadata = {
  title: "Watchlist — PaidPrime",
};

const MAX_EVENT_ROWS = 5000;

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

  const list = items ?? [];
  const tickers = list.map((i) => i.ticker);
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - TTM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [enriched, ttmEvents, upcomingEvents] = await Promise.all([
    enrichTickers(tickers, "1mo"),
    tickers.length === 0
      ? Promise.resolve({ data: [] as { ticker: string; amount_per_share: number }[] })
      : supabase
          .from("dividend_events")
          .select("ticker, amount_per_share")
          .in("ticker", tickers)
          .gte("pay_date", since)
          .limit(MAX_EVENT_ROWS),
    tickers.length === 0
      ? Promise.resolve({ data: [] as { ticker: string; ex_date: string | null }[] })
      : supabase
          .from("dividend_events")
          .select("ticker, ex_date")
          .in("ticker", tickers)
          .not("ex_date", "is", null)
          .gte("ex_date", today)
          .order("ex_date", { ascending: true })
          .limit(MAX_EVENT_ROWS),
  ]);

  const ttmDps = new Map<string, number>();
  for (const event of ttmEvents.data ?? []) {
    const key = event.ticker.toUpperCase();
    ttmDps.set(key, (ttmDps.get(key) ?? 0) + Number(event.amount_per_share));
  }

  const nextEx = new Map<string, string>();
  for (const event of upcomingEvents.data ?? []) {
    if (!event.ex_date) continue;
    const key = event.ticker.toUpperCase();
    if (!nextEx.has(key)) nextEx.set(key, event.ex_date);
  }

  const rows: WatchlistItem[] = list.map((item) => {
    const info = enriched.get(item.ticker.toUpperCase());
    const price = info?.quote?.price ?? null;
    const dps = ttmDps.get(item.ticker.toUpperCase()) ?? 0;
    const yieldPct = price != null && price > 0 && dps > 0 ? (dps / price) * 100 : null;
    return {
      id: item.id,
      ticker: item.ticker,
      name: info?.name ?? item.company_name ?? null,
      price,
      yieldPct,
      nextExDate: nextEx.get(item.ticker.toUpperCase()) ?? null,
      sparkline: info?.sparkline ?? [],
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Markets</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Watchlist
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          Monitor price action, yield and upcoming ex-dividend dates before you buy.
        </p>
      </header>

      <section className="rounded-[14px] border border-[#22262c] bg-[#121417] p-5">
        <AddWatchlistForm />
      </section>

      <WatchlistTable items={rows} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
