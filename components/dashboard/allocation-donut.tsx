"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const ALLOC_COLORS = ["#4c82f7", "#3fbf87", "#e0a45c", "#8b7fe8", "#5fb2c9", "#d8695f"] as const;

export type AllocationSegment = {
  label: string;
  value: number;
};

function formatMoney(value: number) {
  if (Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type AllocationDonutProps = {
  segments: AllocationSegment[];
  totalLabel?: string;
};

export function AllocationDonut({ segments, totalLabel = "Total" }: AllocationDonutProps) {
  const [active, setActive] = useState<string | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const cx = 110;
  const cy = 110;

  let offset = 0;
  const arcs = segments.map((segment, i) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const dash = fraction * circumference;
    const arc = {
      ...segment,
      dash,
      offset,
      color: ALLOC_COLORS[i % ALLOC_COLORS.length]!,
      percent: fraction * 100,
    };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative size-[220px]">
        <svg viewBox="0 0 220 220" width={220} height={220} role="img" aria-label="Sector allocation" className="size-[220px]">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#22262c" strokeWidth={28} />
          {arcs.map((arc) => {
            const dimmed = active != null && active !== arc.label;
            return (
              <circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={28}
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
                pointerEvents="stroke"
                className="cursor-pointer transition-opacity"
                style={{ opacity: dimmed ? 0.28 : 1 }}
                onMouseEnter={() => setActive(arc.label)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">{totalLabel}</p>
          <p className="text-[20px] leading-[33px] tracking-[-0.4px] text-[#f2f4f7]">{formatMoney(total)}</p>
        </div>
      </div>

      <ul className="m-0 flex w-full list-none flex-col p-0">
        {arcs.map((arc, i) => (
          <li key={arc.label}>
            <button
              type="button"
              onMouseEnter={() => setActive(arc.label)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-[8px] py-3 pr-2 pl-2 text-left",
                i < arcs.length - 1 && "border-b border-[#22262c]",
                active === arc.label && "bg-[#16191d]",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-[6px]" style={{ background: arc.color }} />
                <span className="truncate text-[14px] text-[#99a1ac]">{arc.label}</span>
              </span>
              <span className="shrink-0 text-[14px] tracking-[-0.28px] text-[#f2f4f7]">{arc.percent.toFixed(0)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
