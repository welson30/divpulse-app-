import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CalendarCheck, CalendarClock, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalendarGrid, type CalendarDayEvent } from "@/components/dashboard/calendar-grid";
import { CalendarMonthJump } from "@/components/dashboard/calendar-month-jump";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { StatCard } from "@/components/dashboard/market-stats";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Calendar — PaidPrime",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function clampMonth(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : fallback;
}

function clampYear(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: monthParam, year: yearParam } = await searchParams;

  const now = new Date();
  const realYear = now.getUTCFullYear();
  const realMonth = now.getUTCMonth() + 1; // 1-indexed
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

  const [{ data: holdings }, { data: profile }] = await Promise.all([
    supabase.from("holdings").select("ticker").eq("user_id", user!.id),
    supabase.from("profiles").select("calendar_privacy_mode").eq("id", user!.id).single(),
  ]);
  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const calendarPrivacyMode = profile?.calendar_privacy_mode ?? "full";

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: events } =
    tickers.length > 0
      ? await supabase
          .from("dividend_events")
          .select("ticker, ex_date, pay_date, amount_per_share")
          .in("ticker", tickers)
          .or(`and(pay_date.gte.${monthStart},pay_date.lte.${monthEnd}),and(ex_date.gte.${monthStart},ex_date.lte.${monthEnd})`)
      : { data: [] };

  // Scoped to the real today's date regardless of which month is being
  // browsed — the month-scoped query above won't include today's row
  // once the user navigates away from the current month.
  const { data: todayEvents } =
    tickers.length > 0
      ? await supabase
          .from("dividend_events")
          .select("ticker, ex_date, pay_date")
          .in("ticker", tickers)
          .or(`pay_date.eq.${todayStr},ex_date.eq.${todayStr}`)
      : { data: [] };

  const eventsByDay = new Map<number, CalendarDayEvent[]>();
  let paymentCount = 0;
  let exDateCount = 0;

  for (const event of events ?? []) {
    if (event.pay_date) {
      const payDay = new Date(`${event.pay_date}T00:00:00Z`);
      if (payDay.getUTCFullYear() === year && payDay.getUTCMonth() + 1 === month) {
        const day = payDay.getUTCDate();
        const amount = Number(event.amount_per_share).toFixed(2);
        const label =
          calendarPrivacyMode === "amount_only" ? `$${amount}` : calendarPrivacyMode === "ticker_only" ? event.ticker : `${event.ticker} $${amount}`;
        const list = eventsByDay.get(day) ?? [];
        list.push({ label, kind: "pay" });
        eventsByDay.set(day, list);
        paymentCount += 1;
      }
    }
    if (event.ex_date && event.ex_date !== event.pay_date) {
      const exDay = new Date(`${event.ex_date}T00:00:00Z`);
      if (exDay.getUTCFullYear() === year && exDay.getUTCMonth() + 1 === month) {
        const day = exDay.getUTCDate();
        const label = calendarPrivacyMode === "amount_only" ? "ex" : `${event.ticker} ex`;
        const list = eventsByDay.get(day) ?? [];
        list.push({ label, kind: "ex" });
        eventsByDay.set(day, list);
        exDateCount += 1;
      }
    }
  }

  let todayCount = 0;
  for (const event of todayEvents ?? []) {
    if (event.pay_date === todayStr) todayCount += 1;
    if (event.ex_date === todayStr && event.ex_date !== event.pay_date) todayCount += 1;
  }

  const todayLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const isMonthEmpty = paymentCount === 0 && exDateCount === 0;

  if (tickers.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Calendar</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to see its dividend calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-sp-2">
          <div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon-sm">
                <Link href={`/calendar?month=${prevMonth}&year=${prevYear}`} aria-label="Previous month">
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-h1 font-display font-semibold text-text-primary">
                {MONTH_NAMES[month - 1]} {year}
              </h1>
              <Button asChild variant="ghost" size="icon-sm">
                <Link href={`/calendar?month=${nextMonth}&year=${nextYear}`} aria-label="Next month">
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {paymentCount} dividend {paymentCount === 1 ? "payment" : "payments"} • {exDateCount}{" "}
              {exDateCount === 1 ? "ex-date" : "ex-dates"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/calendar">Today</Link>
            </Button>
            <CalendarMonthJump month={month} year={year} />
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <CalendarGrid month={month} year={year} eventsByDay={eventsByDay} todayDay={todayDay} />

        <div className="mt-sp-3 flex flex-wrap gap-sp-3 border-t border-border-subtle pt-sp-2">
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-full bg-green-500" />
            Payment
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-full bg-warning" />
            Ex-date
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-full bg-info" />
            Today
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-sp-2">
        <StatCard label="Payments" value={String(paymentCount)} sub={`in ${MONTH_NAMES[month - 1]} ${year}`} icon={CalendarCheck} iconColor="green" compact />
        <StatCard label="Ex-dates" value={String(exDateCount)} sub={`in ${MONTH_NAMES[month - 1]} ${year}`} icon={CalendarClock} iconColor="amber" compact />
        <StatCard label="Today" value={String(todayCount)} sub={todayLabel} icon={Clock} iconColor="blue" compact />
      </div>

      {isMonthEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <Calendar className="size-8 text-text-tertiary" aria-hidden />
          <p className="text-sm font-medium text-text-primary">No dividend activity</p>
          <p className="text-sm text-text-secondary">
            There are no payments or ex-dates in {MONTH_NAMES[month - 1]} {year}. Enjoy the calm before the next income.
          </p>
        </div>
      ) : null}
    </div>
  );
}
