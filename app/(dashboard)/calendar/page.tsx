import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CalendarGrid, type CalendarDayEvent } from "@/components/dashboard/calendar-grid";

export const metadata: Metadata = {
  title: "Calendar — PaidPrime",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase.from("holdings").select("ticker").eq("user_id", user!.id);
  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-indexed
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

  const eventsByDay = new Map<number, CalendarDayEvent[]>();
  let paymentCount = 0;
  let exDateCount = 0;

  for (const event of events ?? []) {
    if (event.pay_date) {
      const payDay = new Date(`${event.pay_date}T00:00:00Z`);
      if (payDay.getUTCFullYear() === year && payDay.getUTCMonth() + 1 === month) {
        const day = payDay.getUTCDate();
        const list = eventsByDay.get(day) ?? [];
        list.push({ label: `${event.ticker} $${Number(event.amount_per_share).toFixed(2)}`, kind: "pay" });
        eventsByDay.set(day, list);
        paymentCount += 1;
      }
    }
    if (event.ex_date && event.ex_date !== event.pay_date) {
      const exDay = new Date(`${event.ex_date}T00:00:00Z`);
      if (exDay.getUTCFullYear() === year && exDay.getUTCMonth() + 1 === month) {
        const day = exDay.getUTCDate();
        const list = eventsByDay.get(day) ?? [];
        list.push({ label: `${event.ticker} ex`, kind: "ex" });
        eventsByDay.set(day, list);
        exDateCount += 1;
      }
    }
  }

  const isCurrentMonth = true; // this page always shows the current UTC month
  const todayDay = isCurrentMonth ? now.getUTCDate() : null;

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
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">
          {MONTH_NAMES[month - 1]} {year}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {paymentCount} dividend {paymentCount === 1 ? "payment" : "payments"} · {exDateCount}{" "}
          {exDateCount === 1 ? "ex-date" : "ex-dates"}
        </p>
      </div>

      <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <CalendarGrid month={month} year={year} eventsByDay={eventsByDay} todayDay={todayDay} />

        <div className="mt-sp-3 flex flex-wrap gap-sp-3 border-t border-border-subtle pt-sp-2">
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-[2px] bg-green-500/40" />
            Payment
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-[2px] bg-warning/40" />
            Ex-date
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span aria-hidden className="size-2 rounded-[2px] border border-green-500" />
            Today
          </span>
        </div>
      </div>
    </div>
  );
}
