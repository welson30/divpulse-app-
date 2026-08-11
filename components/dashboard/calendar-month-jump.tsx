"use client";

import { useRouter } from "next/navigation";

type CalendarMonthJumpProps = {
  month: number;
  year: number;
};

/** Invisible native month picker over the calendar heading — jump without breaking the Figma prev/today/next cluster. */
export function CalendarMonthJump({ month, year }: CalendarMonthJumpProps) {
  const router = useRouter();
  const value = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <input
      type="month"
      aria-label="Jump to month"
      value={value}
      onChange={(e) => {
        const [y, m] = e.target.value.split("-");
        if (y && m) router.push(`/calendar?month=${Number(m)}&year=${y}`);
      }}
      className="absolute inset-0 cursor-pointer opacity-0"
    />
  );
}
