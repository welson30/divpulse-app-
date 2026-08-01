"use client";

import { cn } from "@/lib/utils";
import type { ChartRange } from "@/lib/dividend-data/types";

const RANGES: Array<{ value: ChartRange; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "1W" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
];

type RangeSwitcherProps = {
  active: ChartRange;
  onChange: (range: ChartRange) => void;
  disabled?: boolean;
};

/**
 * Segmented pill control for the chart's time range — same active/inactive
 * treatment already proven in components/marketing/product-tabs.tsx's
 * category/dimension filters, first time it lands on a real page.
 */
export function RangeSwitcher({ active, onChange, disabled }: RangeSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Chart range"
      className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {RANGES.map((range) => {
        const isActive = range.value === active;
        return (
          <button
            key={range.value}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => onChange(range.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40",
              isActive
                ? "border-green-500 bg-green-500 text-canvas"
                : "border-border-subtle text-text-secondary hover:border-border-interactive hover:text-text-primary",
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
