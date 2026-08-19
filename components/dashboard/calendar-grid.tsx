"use client";

import { cn } from "@/lib/utils";

export type CalendarPayment = {
  day: number;
  ticker: string;
  name: string;
  kind: "pay" | "estimated";
  amount: number | null;
  broker: string | null;
  frequency: string | null;
  /** True when calendar_privacy_mode is "amount_only" — ticker/company must never be shown, only the amount. */
  identityHidden: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatAmount(value: number, estimated: boolean) {
  const body = `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return estimated ? `~${body}` : body;
}

export function CalendarGrid({
  month,
  year,
  payments,
  todayDay,
  selectedDay,
  onSelectDay,
}: {
  month: number;
  year: number;
  payments: CalendarPayment[];
  todayDay: number | null;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = new Date(year, month - 1, 1).getDay();
  const totalCells = leadingBlanks + daysInMonth;
  const trailingBlanks = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  const byDay = new Map<number, CalendarPayment[]>();
  for (const payment of payments) {
    const list = byDay.get(payment.day) ?? [];
    list.push(payment);
    byDay.set(payment.day, list);
  }

  return (
    <div className="overflow-hidden rounded-[10px]">
      <div className="grid grid-cols-7 gap-px bg-[#22262c]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-[#121417] py-2 text-center text-[10px] tracking-[1.2px] text-[#6c737f] uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[#22262c]">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`lead-${i}`} className="min-h-[86px] bg-[#121417] opacity-40" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = byDay.get(day) ?? [];
          const isSelected = day === selectedDay;
          const isToday = day === todayDay;
          const visible = events.slice(0, 1);
          const extra = events.length - visible.length;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative flex min-h-[86px] flex-col items-start gap-1.5 bg-[#121417] px-2 py-2 text-left outline-none",
                isSelected && "z-[1] shadow-[inset_0_0_0_1px_#3fbf87]",
              )}
            >
              <span
                className={cn(
                  "text-[12px] tracking-[-0.24px] text-[#99a1ac]",
                  isToday && !isSelected && "font-medium text-[#3fbf87]",
                )}
              >
                {day}
              </span>
              {visible.length > 0 ? (
                <span className="flex w-full min-w-0 flex-col gap-1">
                  {visible.map((event, idx) => (
                    <span key={`${event.ticker}-${idx}`} className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate rounded-[6px] px-1.5 py-0.5 text-[10px] font-medium text-[#3fbf87]",
                          event.kind === "estimated"
                            ? "border border-dashed border-[rgba(63,191,135,0.5)] bg-transparent"
                            : "bg-[#10261e]",
                        )}
                      >
                        {event.identityHidden ? "•••" : event.ticker}
                      </span>
                      {event.amount != null ? (
                        <span className="truncate text-[10px] tracking-[-0.2px] text-[#6c737f]">
                          {formatAmount(event.amount, event.kind === "estimated")}
                        </span>
                      ) : null}
                    </span>
                  ))}
                  {extra > 0 ? (
                    <span className="text-[10px] text-[#6c737f]">+{extra} more</span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
        {Array.from({ length: trailingBlanks }).map((_, i) => (
          <div key={`trail-${i}`} className="min-h-[86px] bg-[#121417] opacity-40" />
        ))}
      </div>
    </div>
  );
}
