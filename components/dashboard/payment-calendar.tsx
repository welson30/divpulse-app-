"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarGrid, type CalendarPayment } from "@/components/dashboard/calendar-grid";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { CalendarMonthJump } from "@/components/dashboard/calendar-month-jump";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentCalendar({
  month,
  year,
  monthLabel,
  expectedLabel,
  todayDay,
  payments,
  prevHref,
  nextHref,
  todayHref,
  children,
}: {
  month: number;
  year: number;
  monthLabel: string;
  expectedLabel: string;
  todayDay: number | null;
  payments: CalendarPayment[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
  children?: React.ReactNode;
}) {
  const firstEventDay = useMemo(() => {
    const days = [...new Set(payments.map((p) => p.day))].sort((a, b) => a - b);
    return days[0] ?? 1;
  }, [payments]);

  const [selectedDay, setSelectedDay] = useState(todayDay ?? firstEventDay);
  useEffect(() => {
    setSelectedDay(todayDay ?? firstEventDay);
  }, [month, year, todayDay, firstEventDay]);
  const selected = payments.filter((p) => p.day === selectedDay);
  const dateLabel = `${MONTH_SHORT[month - 1]} ${selectedDay}`;
  const paymentCount = selected.length;

  return (
    <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
          <div className="relative min-w-0">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              {monthLabel}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{expectedLabel}</p>
            <CalendarMonthJump month={month} year={year} />
          </div>
          <div className="flex items-center gap-1 rounded-[10px] border border-[#22262c] bg-[#0b0c0e] p-[4.8px]">
            <Link
              href={prevHref}
              aria-label="Previous month"
              className="flex size-8 items-center justify-center rounded-[8px] text-[#99a1ac] hover:bg-[#16191d]"
            >
              <FigmaIcon src="/marketing/dashboard/icon-chevron-left.svg" className="size-4" />
            </Link>
            <Link
              href={todayHref}
              className="px-2.5 py-0.5 text-center text-[11px] tracking-[1.1px] text-[#6c737f] uppercase hover:text-[#f2f4f7]"
            >
              Today
            </Link>
            <Link
              href={nextHref}
              aria-label="Next month"
              className="flex size-8 items-center justify-center rounded-[8px] text-[#99a1ac] hover:bg-[#16191d]"
            >
              <FigmaIcon src="/marketing/dashboard/icon-chevron-right.svg" className="size-4" />
            </Link>
          </div>
        </header>
        <div className="p-6">
          <CalendarGrid
            month={month}
            year={year}
            payments={payments}
            todayDay={todayDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              {dateLabel}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              {paymentCount} {paymentCount === 1 ? "payment" : "payments"}
            </p>
          </header>
          <div className="px-6 py-2">
            {selected.length === 0 ? (
              <p className="py-4 text-[13px] leading-[21.45px] text-[#99a1ac]">No payments on this day.</p>
            ) : (
              selected.map((event, i) => (
                <div
                  key={`${event.ticker}-${i}`}
                  className={`flex flex-col gap-2 py-3.5 ${i < selected.length - 1 ? "border-b border-[#22262c]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-[23.1px] text-[#f2f4f7]">{event.ticker}</p>
                      <p className="truncate text-[12px] leading-[19.8px] text-[#6c737f]">{event.name}</p>
                    </div>
                    <p className="shrink-0 text-[14px] tracking-[-0.28px] text-[#3fbf87]">
                      {event.amount != null
                        ? `${event.kind === "estimated" ? "~" : ""}${formatMoney(event.amount)}`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <BrokerMark name={event.broker} />
                    <span className="rounded-[8px] border border-[#2e343b] bg-[#16191d] px-2 py-1 text-[11px] tracking-[1.1px] text-[#99a1ac] uppercase">
                      {event.kind === "estimated" ? "Estimated" : event.frequency ?? "Recorded"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        {children}
      </aside>
    </div>
  );
}
