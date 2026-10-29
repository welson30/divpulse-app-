import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { estimateUpcomingPayments, getTickerFrequencies } from "@/lib/dividend-data/next-payment";
import { PaymentCalendar } from "@/components/dashboard/payment-calendar";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import type { CalendarPayment } from "@/components/dashboard/calendar-grid";

export const metadata: Metadata = {
  title: "Calendar — PaidPrime",
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSyncAgo(iso: string | null, t: (...args: any[]) => string): string | null {
  if (!iso) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return t("syncJustNow");
  if (mins < 60) return t("syncMinAgo", { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("syncHoursAgo", { n: hours });
  const days = Math.round(hours / 24);
  return t("syncDaysAgo", { n: days });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function connectionBadge(status: string, t: (...args: any[]) => string) {
  if (status === "error") {
    return {
      label: t("badgeAttention"),
      className: "border-[rgba(216,105,95,0.3)] bg-[#261615] text-[#d8695f]",
    };
  }
  return {
    label: t("badgeSynced"),
    className: "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const [t, tc, locale] = await Promise.all([
    getTranslations("dashboard.calendar"),
    getTranslations("dashboard.common"),
    getLocale(),
  ]);

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
    <header className="relative overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] px-5 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)] min-[900px]:px-6">
      {/* Ambient gradient mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-[#3fbf87] opacity-[0.04] blur-3xl" />
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-[#60a5fa] opacity-[0.035] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-48 rounded-full bg-[#a78bfa] opacity-[0.03] blur-2xl" />
      </div>
      <div className="relative z-[1]">
        <p className="text-[11px] tracking-[2.2px] text-[#3d4554] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#e8eaf0] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#3d4554]">
          {t("subtitle")}
        </p>
      </div>
    </header>
  );

  const footer = (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1c2028] pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
      <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
      <p className="text-[12px] leading-[19.8px] text-[#3d4554]">{tc("footerDisclaimer")}</p>
    </footer>
  );

  const brokers = (
    <section className="overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      <header className="border-b border-[#1c2028] px-6 py-5">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#e8eaf0]">
          {t("brokerIntegrations")}
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#3d4554]">{t("brokerSyncSub")}</p>
      </header>
      {brokerConnections && brokerConnections.length > 0 ? (
        <div className="px-6 py-2">
          {brokerConnections.map((row, i) => {
            const badge = connectionBadge(row.status, t);
            const ago = formatSyncAgo(row.last_synced_at, t);
            return (
              <div
                key={row.id}
                className={`flex items-center justify-between gap-3 py-3.5 ${
                  i < brokerConnections.length - 1 ? "border-b border-[#1c2028]" : ""
                }`}
              >
                <BrokerMark name={row.institution_name} />
                <div className="flex shrink-0 items-center gap-2">
                  {ago ? <span className="text-[11px] leading-[18.15px] text-[#3d4554]">{ago}</span> : null}
                  <span className={`rounded-[8px] border px-2 py-1 text-[11px] tracking-[1.1px] uppercase ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-6 py-5 text-[13px] leading-[21.45px] text-[#3d4554]">
          {t("noBrokers")}{" "}
          <Link href="/brokers" className="text-[#60a5fa] hover:underline">
            {t("connectBrokerage")}
          </Link>
        </p>
      )}
      <div className="border-t border-[#1c2028] px-6 py-4">
        <p className="text-[12px] leading-[19.8px] text-[#3d4554]">
          {t("readOnlyNote")}
        </p>
      </div>
    </section>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[18px] border border-[#1c2028] bg-[#0b0e12] px-6 py-12 text-center text-sm text-[#3d4554]">
            {t("addHoldingPrompt")}
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
  const rawMonthName = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const monthLabelStr = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  const expectedLabel = hideAmount
    ? t("paymentsCount", { n: payments.length })
    : isPastMonth && !hasEstimate
      ? t("recordedThisMonth", { amount: formatMoney(monthTotal) })
      : t("expectedThisMonth", { amount: `${hasEstimate ? "~" : ""}${formatMoney(monthTotal)}` });

  return (
    <div className="flex flex-col gap-6">
      {header}
      <PaymentCalendar
        month={month}
        year={year}
        monthLabel={monthLabelStr}
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
