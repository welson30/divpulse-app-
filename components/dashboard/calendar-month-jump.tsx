"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

type CalendarMonthJumpProps = {
  month: number;
  year: number;
};

/** Icon button wrapping an invisible native month picker — lets the user jump straight to a distant month/year instead of clicking Prev repeatedly. */
export function CalendarMonthJump({ month, year }: CalendarMonthJumpProps) {
  const router = useRouter();
  const value = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <label className="relative inline-flex size-7 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background hover:bg-muted">
      <Calendar className="size-3.5" aria-hidden />
      <span className="sr-only">Jump to month</span>
      <input
        type="month"
        aria-label="Jump to month"
        value={value}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-");
          if (y && m) router.push(`/calendar?month=${Number(m)}&year=${y}`);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}
