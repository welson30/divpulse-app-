"use client";

import { cn } from "@/lib/utils";

export type CalendarDayEvent = {
  label: string;
  /** "estimated" is a cadence-based guess (no real dividend_events row yet) — always rendered distinctly from a confirmed "pay". */
  kind: "pay" | "ex" | "estimated";
  /** Actual dollars this event contributes to the day — undefined for ex-dates (no dollar value) and whenever the "ticker only" privacy mode hides amounts. */
  amount?: number;
};

export type CalendarGridProps = {
  /** 1-indexed month (1 = January) */
  month: number;
  year: number;
  /** Map of day-of-month -> events on that day */
  eventsByDay: Map<number, CalendarDayEvent[]>;
  todayDay: number | null;
};

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function PadCell({ day }: { day: number }) {
  return (
    <div className="flex min-h-13.5 flex-col gap-0.5 rounded-[6px] border border-transparent p-1 text-[10px]">
      <span className="font-mono text-text-tertiary/50">{day}</span>
    </div>
  );
}

/** Ported from the marketing site's product-tabs.tsx CalendarPanel demo, driven by real data instead of a fixture array. */
export function CalendarGrid({ month, year, eventsByDay, todayDay }: CalendarGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  // JS getDay(): 0=Sunday..6=Saturday — grid is Sunday-first, so this is
  // used directly as the leading-pad-cell count, no remap needed.
  const leadingBlanks = new Date(year, month - 1, 1).getDay();

  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const leadingPadDays = Array.from({ length: leadingBlanks }, (_, i) => prevMonthDays - leadingBlanks + i + 1);

  const totalCells = leadingBlanks + daysInMonth;
  const trailingBlanks = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const trailingPadDays = Array.from({ length: trailingBlanks }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_LABELS.map((d, i) => (
        <div key={i} className="text-center font-mono text-[10px] text-text-secondary">
          {d}
        </div>
      ))}
      {leadingPadDays.map((day, i) => (
        <PadCell key={`lead-${i}`} day={day} />
      ))}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const events = eventsByDay.get(day) ?? [];
        const isToday = day === todayDay;
        const primaryKind: "pay" | "ex" | "estimated" | null = events.some((e) => e.kind === "pay")
          ? "pay"
          : events.some((e) => e.kind === "ex")
            ? "ex"
            : events.some((e) => e.kind === "estimated")
              ? "estimated"
              : null;
        const isInert = events.length === 0 && !isToday;
        // Only worth a total once there's more than one dollar figure to
        // add up — a single event already shows its own amount above.
        const dollarEvents = events.filter((e) => e.amount != null);
        const dayTotal = dollarEvents.reduce((sum, e) => sum + e.amount!, 0);
        const totalHasEstimate = dollarEvents.some((e) => e.kind === "estimated");

        return (
          <div
            key={day}
            className={cn(
              "group relative flex min-h-13.5 cursor-default flex-col gap-0.5 rounded-[6px] border p-1 text-[10px] transition-all duration-150 ease-out",
              !isInert && "hover:z-10 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]",
              isToday
                ? "border-info bg-info/8 hover:border-info/70 hover:bg-info/14"
                : primaryKind === "pay"
                  ? "border-green-500/30 bg-[rgba(52,211,153,0.08)] hover:border-green-500/60 hover:bg-[rgba(52,211,153,0.14)]"
                  : primaryKind === "ex"
                    ? "border-warning/20 bg-[rgba(251,191,36,0.06)] hover:border-warning/50 hover:bg-[rgba(251,191,36,0.12)]"
                    : primaryKind === "estimated"
                      ? "border-dashed border-green-500/40 bg-transparent hover:border-green-500/60 hover:bg-[rgba(52,211,153,0.06)]"
                      : "border-border-subtle bg-surface-2 hover:border-border-interactive",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-mono", isToday ? "font-bold text-info" : "text-text-secondary")}>{day}</span>
              {events.length > 0 ? (
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold",
                    primaryKind === "pay"
                      ? "bg-green-500 text-white"
                      : primaryKind === "ex"
                        ? "bg-warning text-white"
                        : "border border-dashed border-green-500/60 bg-transparent text-green-500",
                  )}
                >
                  {events.length}
                </span>
              ) : null}
            </div>
            {events.map((event, idx) => (
              <span
                key={idx}
                className={cn(
                  "truncate rounded-[3px] px-1 py-0.5 text-[9px] transition-colors",
                  event.kind === "pay"
                    ? "bg-green-900/60 text-green-500"
                    : event.kind === "ex"
                      ? "bg-warning/15 text-warning"
                      : "border border-dashed border-green-500/40 bg-transparent text-green-500",
                )}
              >
                {event.label}
              </span>
            ))}
            {dollarEvents.length > 1 ? (
              <span
                className={cn(
                  "mt-auto truncate rounded-[3px] px-1 py-0.5 text-[9px] font-bold",
                  totalHasEstimate
                    ? "border border-dashed border-green-500/50 text-green-500"
                    : "bg-green-500/20 text-green-500",
                )}
              >
                {totalHasEstimate ? "~" : ""}${dayTotal.toFixed(2)} total
              </span>
            ) : null}
          </div>
        );
      })}
      {trailingPadDays.map((day, i) => (
        <PadCell key={`trail-${i}`} day={day} />
      ))}
    </div>
  );
}
