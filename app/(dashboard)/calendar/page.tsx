import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { estimateUpcomingPayments, getTickerFrequencies } from "@/lib/dividend-data/next-payment";
import { PaymentCalendar } from "@/components/dashboard/payment-calendar";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import type { CalendarPayment } from "@/components/dashboard/calendar-grid";

export const metadata: Metadata = {
  title: "Calendar — PaidPrime",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function clampMonth(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : fallback;
}

function clampYear(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSyncAgo(iso: string | null) {
  if (!iso) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function connectionBadge(status: string) {
  if (status === "error") {
    return {
      label: "Attention",
      className: "border-[rgba(216,105,95,0.3)] bg-[#261615] text-[#d8695f]",
    };
  }
  return {
    label: "Synced",
    className: "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: monthParam, year: yearParam } = await searchParams;

  const now = new Date();
  const realYear = now.getUTCFullYear();
  const realMonth = now.getUTCMonth() + 1;
  const todayStr = `${realYear}-${String(realMonth).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

  const year = clampYear(yearParam, realYear);
  const month = clampMonth(monthParam, realMonth);
  const isCurrentMonth = month === realMonth && year === realYear;
  const todayDay = isCurrentMonth ? now.getUTCDate() : null;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: profile }, { data: brokerConnections }] = await Promise.all([
    supabase.from("holdings").select("ticker, shares, broker_name, company_name").eq("user_id", user!.id),
    supabase.from("profiles").select("calendar_privacy_mode").eq("id", user!.id).single(),
    supabase
      .from("broker_connections")
      .select("id, institution_name, status, last_synced_at")
      .eq("user_id", user!.id)
      .neq("status", "disconnected")
      .order("created_at", { ascending: false }),
  ]);

  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const calendarPrivacyMode = profile?.calendar_privacy_mode ?? "full";
  const sharesByTicker = new Map<string, number>();
  const brokerByTicker = new Map<string, { name: string; shares: number }>();
  for (const h of holdings ?? []) {
    const shares = Number(h.shares);
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + shares);
    if (h.broker_name) {
      const current = brokerByTicker.get(h.ticker);
      if (!current || shares > current.shares) brokerByTicker.set(h.ticker, { name: h.broker_name, shares });
    }
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const header = (
    <header className="border-b border-[#22262c] pb-6">
      <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Calendar</p>
      <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
        Payment calendar
      </h1>
      <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
        Expected and confirmed dividend payments mapped to the calendar.
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

  const brokers = (
    <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
      <header className="border-b border-[#22262c] px-6 py-5">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          Broker integrations
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Sync status across accounts</p>
      </header>
      {brokerConnections && brokerConnections.length > 0 ? (
        <div className="px-6 py-2">
          {brokerConnections.map((row, i) => {
            const badge = connectionBadge(row.status);
            const ago = formatSyncAgo(row.last_synced_at);
            return (
              <div
                key={row.id}
                className={`flex items-center justify-between gap-3 py-3.5 ${
                  i < brokerConnections.length - 1 ? "border-b border-[#22262c]" : ""
                }`}
              >
                <BrokerMark name={row.institution_name} />
                <div className="flex shrink-0 items-center gap-2">
                  {ago ? <span className="text-[11px] leading-[18.15px] text-[#6c737f]">{ago}</span> : null}
                  <span className={`rounded-[8px] border px-2 py-1 text-[11px] tracking-[1.1px] uppercase ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-6 py-5 text-[13px] leading-[21.45px] text-[#99a1ac]">
          No brokers connected.{" "}
          <Link href="/brokers" className="text-[#4c82f7] hover:underline">
            Connect a brokerage
          </Link>
        </p>
      )}
      <div className="border-t border-[#22262c] px-6 py-4">
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">
          All connections are read-only; PaidPrime never has withdrawal access.
        </p>
      </div>
    </section>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center text-sm text-[#99a1ac]">
            Add a holding to see its dividend calendar.
          </div>
          {brokers}
        </div>
        {footer}
      </div>
    );
  }

  const [{ data: events }, upcomingEstimates, frequencies, enriched] = await Promise.all([
    supabase
      .from("dividend_events")
      .select("ticker, pay_date, amount_per_share")
      .in("ticker", tickers)
      .gte("pay_date", monthStart)
      .lte("pay_date", monthEnd),
    estimateUpcomingPayments(supabase, tickers, monthStart, monthEnd),
    getTickerFrequencies(supabase, tickers),
    enrichTickers(tickers),
  ]);

  const nameFor = (ticker: string) =>
    enriched.get(ticker.toUpperCase())?.name ??
    holdings.find((h) => h.ticker === ticker)?.company_name ??
    ticker;

  const hideAmount = calendarPrivacyMode === "ticker_only";
  const hideIdentity = calendarPrivacyMode === "amount_only";

  const recordedKeys = new Set<string>();
  const payments: CalendarPayment[] = [];

  for (const event of events ?? []) {
    if (!event.pay_date) continue;
    const payDay = new Date(`${event.pay_date}T00:00:00Z`);
    if (payDay.getUTCFullYear() !== year || payDay.getUTCMonth() + 1 !== month) continue;
    recordedKeys.add(`${event.ticker}|${event.pay_date}`);
    const totalAmount = Number(event.amount_per_share) * (sharesByTicker.get(event.ticker) ?? 0);
    payments.push({
      day: payDay.getUTCDate(),
      ticker: event.ticker,
      name: nameFor(event.ticker),
      kind: "pay",
      amount: hideAmount ? null : totalAmount,
      broker: brokerByTicker.get(event.ticker)?.name ?? null,
      frequency: frequencies.get(event.ticker) ?? null,
      identityHidden: hideIdentity,
    });
  }

  for (const estimate of upcomingEstimates) {
    if (recordedKeys.has(`${estimate.ticker}|${estimate.payDate}`)) continue;
    const payDay = new Date(`${estimate.payDate}T00:00:00Z`);
    if (payDay.getUTCFullYear() !== year || payDay.getUTCMonth() + 1 !== month) continue;
    const totalAmount = estimate.amountPerShare * (sharesByTicker.get(estimate.ticker) ?? 0);
    payments.push({
      day: payDay.getUTCDate(),
      ticker: estimate.ticker,
      name: nameFor(estimate.ticker),
      kind: estimate.source === "confirmed" ? "pay" : "estimated",
      amount: hideAmount ? null : totalAmount,
      broker: brokerByTicker.get(estimate.ticker)?.name ?? null,
      frequency: frequencies.get(estimate.ticker) ?? null,
      identityHidden: hideIdentity,
    });
  }

  payments.sort((a, b) => a.day - b.day || a.ticker.localeCompare(b.ticker));

  const monthTotal = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const hasEstimate = payments.some((p) => p.kind === "estimated");
  const isPastMonth = year < realYear || (year === realYear && month < realMonth);
  const expectedLabel = hideAmount
    ? `${payments.length} ${payments.length === 1 ? "payment" : "payments"} this month`
    : isPastMonth && !hasEstimate
      ? `${formatMoney(monthTotal)} recorded this month`
      : `${hasEstimate ? "~" : ""}${formatMoney(monthTotal)} expected this month`;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <PaymentCalendar
        month={month}
        year={year}
        monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
        expectedLabel={expectedLabel}
        todayDay={todayDay}
        payments={payments}
        prevHref={`/calendar?month=${prevMonth}&year=${prevYear}`}
        nextHref={`/calendar?month=${nextMonth}&year=${nextYear}`}
        todayHref="/calendar"
      >
        {brokers}
      </PaymentCalendar>
      {footer}
    </div>
  );
}
