import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { estimateUpcomingPayments } from "@/lib/dividend-data/next-payment";
import { UpcomingBoard, type UpcomingCard } from "@/components/dashboard/upcoming-board";

export const metadata: Metadata = {
  title: "Upcoming payments — PaidPrime",
};

const LOOKAHEAD_DAYS = 90;

export default async function UpcomingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, broker_name, company_name")
    .eq("user_id", user!.id);

  const header = (
    <header className="border-b border-[#22262c] pb-6">
      <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Upcoming</p>
      <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
        Upcoming payments
      </h1>
      <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
        Every scheduled and projected dividend payment across your connected brokers.
      </p>
    </header>
  );

  const footer = (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
      <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
      <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
    </footer>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center text-sm text-[#99a1ac]">
          Add a holding to see upcoming dividend payments.
        </div>
        {footer}
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const sharesByTicker = new Map<string, number>();
  const brokerByTicker = new Map<string, { name: string; shares: number }>();
  for (const h of holdings) {
    const shares = Number(h.shares);
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + shares);
    if (h.broker_name) {
      const current = brokerByTicker.get(h.ticker);
      if (!current || shares > current.shares) brokerByTicker.set(h.ticker, { name: h.broker_name, shares });
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const rangeEnd = new Date(Date.now() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [enriched, upcoming, { data: scheduled }] = await Promise.all([
    enrichTickers(tickers),
    estimateUpcomingPayments(supabase, tickers, todayIso, rangeEnd),
    supabase
      .from("dividend_events")
      .select("ticker, ex_date, pay_date, amount_per_share")
      .in("ticker", tickers)
      .gte("pay_date", todayIso)
      .lte("pay_date", rangeEnd),
  ]);

  const nameFor = (ticker: string) =>
    enriched.get(ticker.toUpperCase())?.name ?? holdings.find((h) => h.ticker === ticker)?.company_name ?? ticker;

  const cards: UpcomingCard[] = [];
  const seen = new Set<string>();

  for (const event of scheduled ?? []) {
    const key = `${event.ticker}|${event.pay_date}`;
    seen.add(key);
    cards.push({
      ticker: event.ticker,
      name: nameFor(event.ticker),
      amount: Number(event.amount_per_share) * (sharesByTicker.get(event.ticker) ?? 0),
      exDate: event.ex_date ?? null,
      payDate: event.pay_date,
      broker: brokerByTicker.get(event.ticker)?.name ?? null,
      status: "pending",
    });
  }

  for (const row of upcoming) {
    const key = `${row.ticker}|${row.payDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      ticker: row.ticker,
      name: nameFor(row.ticker),
      amount: row.amountPerShare * (sharesByTicker.get(row.ticker) ?? 0),
      exDate: null,
      payDate: row.payDate,
      broker: brokerByTicker.get(row.ticker)?.name ?? null,
      status: row.source === "confirmed" ? "confirmed" : "expected",
    });
  }

  cards.sort((a, b) => a.payDate.localeCompare(b.payDate) || a.ticker.localeCompare(b.ticker));

  return (
    <div className="flex flex-col gap-6">
      {header}
      <UpcomingBoard cards={cards} />
      {footer}
    </div>
  );
}
