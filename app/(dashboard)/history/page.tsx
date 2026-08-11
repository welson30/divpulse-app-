import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { PaymentHistoryBoard, type HistoryRow } from "@/components/dashboard/payment-history-board";

export const metadata: Metadata = {
  title: "Payment history — PaidPrime",
};

const MAX_EVENT_ROWS = 5000;

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("id, ticker, shares, broker_name, company_name")
    .eq("user_id", user!.id);

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
        <PaymentHistoryBoard rows={[]} />
        {footer}
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const holdingById = new Map(holdings.map((h) => [h.id, h]));
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
  const [enriched, { data: events }, { data: payments }] = await Promise.all([
    enrichTickers(tickers),
    supabase
      .from("dividend_events")
      .select("id, ticker, pay_date, amount_per_share")
      .in("ticker", tickers)
      .lte("pay_date", todayIso)
      .order("pay_date", { ascending: false })
      .limit(MAX_EVENT_ROWS),
    supabase
      .from("dividend_payments")
      .select("id, amount, pay_date, holding_id, dividend_event_id")
      .eq("user_id", user!.id)
      .lte("pay_date", todayIso)
      .order("pay_date", { ascending: false }),
  ]);

  const nameFor = (ticker: string) =>
    enriched.get(ticker.toUpperCase())?.name ?? holdings.find((h) => h.ticker === ticker)?.company_name ?? ticker;

  const rows: HistoryRow[] = [];
  const eventsCovered = new Set<string>();

  for (const payment of payments ?? []) {
    const holding = holdingById.get(payment.holding_id);
    const ticker = holding?.ticker;
    if (!ticker) continue;
    eventsCovered.add(payment.dividend_event_id);
    rows.push({
      id: payment.id,
      ticker,
      name: nameFor(ticker),
      broker: holding?.broker_name ?? null,
      payDate: payment.pay_date,
      amount: Number(payment.amount),
    });
  }

  for (const event of events ?? []) {
    if (eventsCovered.has(event.id)) continue;
    const shares = sharesByTicker.get(event.ticker) ?? 0;
    rows.push({
      id: event.id,
      ticker: event.ticker,
      name: nameFor(event.ticker),
      broker: brokerByTicker.get(event.ticker)?.name ?? null,
      payDate: event.pay_date,
      amount: Number(event.amount_per_share) * shares,
    });
  }

  rows.sort((a, b) => b.payDate.localeCompare(a.payDate) || a.ticker.localeCompare(b.ticker));

  return (
    <div className="flex flex-col gap-6">
      <PaymentHistoryBoard rows={rows} />
      {footer}
    </div>
  );
}
