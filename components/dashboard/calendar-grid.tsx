"use client";

import { cn } from "@/lib/utils";

export type CalendarDayEvent = {
  label: string;
  kind: "pay" | "ex";
};

export type CalendarGridProps = {
  /** 1-indexed month (1 = January) */
  month: number;
  year: number;
  /** Map of day-of-month -> events on that day */
  eventsByDay: Map<number, CalendarDayEvent[]>;
  todayDay: number | null;
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Ported from the marketing site's product-tabs.tsx CalendarPanel demo, driven by real data instead of a fixture array. */
export function CalendarGrid({ month, year, eventsByDay, todayDay }: CalendarGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  // JS getDay(): 0=Sunday..6=Saturday. We want a Monday-first grid, so
  // remap to 0=Monday..6=Sunday for the leading-blank-cell count.
  const firstWeekdayJs = new Date(year, month - 1, 1).getDay();
  const leadingBlanks = (firstWeekdayJs + 6) % 7;

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_LABELS.map((d, i) => (
        <div key={i} className="text-center font-mono text-[10px] text-text-secondary">
          {d}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, i) => (
        <div key={`pad-${i}`} />
      ))}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const events = eventsByDay.get(day) ?? [];
        const isToday = day === todayDay;
        const primaryKind: "pay" | "ex" | null = events.some((e) => e.kind === "pay")
          ? "pay"
          : events.some((e) => e.kind === "ex")
            ? "ex"
            : null;
        const isInert = events.length === 0 && !isToday;

        return (
          <div
            key={day}
            className={cn(
              "group relative flex min-h-[54px] cursor-default flex-col gap-0.5 rounded-[6px] border p-1 text-[10px] transition-all duration-150 ease-out",
              !isInert && "hover:z-10 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]",
              isToday
                ? "border-green-500 hover:shadow-[0_0_0_1px_var(--green-500),0_8px_20px_-8px_rgba(52,211,153,0.35)]"
                : primaryKind === "pay"
                  ? "border-green-500/30 bg-[rgba(52,211,153,0.08)] hover:border-green-500/60 hover:bg-[rgba(52,211,153,0.14)]"
                  : primaryKind === "ex"
                    ? "border-warning/20 bg-[rgba(251,191,36,0.06)] hover:border-warning/50 hover:bg-[rgba(251,191,36,0.12)]"
                    : "border-border-subtle bg-surface-2 hover:border-border-interactive",
            )}
          >
            <span className={cn("font-mono", isToday ? "font-bold text-green-500" : "text-text-secondary")}>{day}</span>
            {events.map((event, idx) => (
              <span
                key={idx}
                className={cn(
                  "truncate rounded-[3px] px-1 py-0.5 text-[9px] transition-colors",
                  event.kind === "pay" ? "bg-green-900/60 text-green-500" : "bg-warning/15 text-warning",
                )}
              >
                {event.label}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
