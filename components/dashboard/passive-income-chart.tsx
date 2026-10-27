"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";

// Current month label e.g. "Oct"
const CURRENT_MONTH = new Date().toLocaleString("en-US", { month: "short" });

function niceCeiling(max: number): number {
  if (max <= 0) return 100;
  const padded = max * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function PassiveIncomeChart({
  data,
  className,
  title = "Passive income",
  subtitle = "Dividends received per month, trailing 12 months",
  chartClassName,
}: {
  data: MonthlyIncomePoint[];
  className?: string;
  title?: string;
  subtitle?: string;
  chartClassName?: string;
}) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));
  const avgTotal = data.length > 0 ? data.reduce((s, d) => s + d.total, 0) / data.length : 0;

  return (
    <section className={cn("flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]", className)}>
      <header className="border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{subtitle}</p>
      </header>
      {/* Tooltip */}
      {hoveredMonth && (() => {
        const d = data.find((x) => x.month === hoveredMonth);
        return d ? (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-lg border border-[#22262c] bg-[#0d1117] px-3 py-2 min-[900px]:mx-6">
            <span className="font-[family-name:var(--font-outfit)] text-[12px] text-[#99a1ac]">{d.label}</span>
            <span className="font-[family-name:var(--font-outfit)] text-[13px] font-semibold text-[#3fbf87]">
              ${d.total.toFixed(2)}
            </span>
          </div>
        ) : null;
      })()}

      <div className="px-4 pb-5 pt-2 min-[900px]:px-6">
        {max <= 0 ? (
          <div
            className={cn(
              "flex h-[220px] items-center justify-center text-center text-[13px] text-[#99a1ac] min-[900px]:h-[260px]",
              chartClassName,
            )}
          >
            Payouts appear here as your holdings pay them.
          </div>
        ) : (
          <div className={cn("flex h-[220px] gap-2 min-[900px]:h-[260px]", chartClassName)}>
            {/* SVG gradient definition */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3fbf87" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1a6644" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="bar-gradient-current" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5de3a3" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3fbf87" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="bar-gradient-hover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7eefc0" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3fbf87" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex w-9 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right font-[family-name:var(--font-outfit)] text-[11px] text-[#6c737f]">
              {ticks.map((t) => (
                <span key={t.p}>{t.label}</span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 items-end gap-1.5">
                {ticks.map((t) => (
                  <div
                    key={t.p}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-[#22262c]"
                    style={{ bottom: `${t.p * 100}%` }}
                  />
                ))}
                {/* Average line */}
                {avgTotal > 0 && (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 border-t border-dashed border-[#3fbf87]/20 z-[2]"
                    style={{ bottom: `${(avgTotal / niceMax) * 100}%` }}
                  />
                )}
                {data.map((d) => {
                  const heightPct = niceMax > 0 ? (d.total / niceMax) * 100 : 0;
                  const isCurrent = d.label === CURRENT_MONTH;
                  const isHovered = hoveredMonth === d.month;
                  return (
                    <div
                      key={d.month}
                      className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end cursor-pointer"
                      onMouseEnter={() => setHoveredMonth(d.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <div
                        className="w-full max-w-[28px] rounded-t-[4px] transition-all duration-150"
                        style={{
                          height: `${Math.max(heightPct, 2)}%`,
                          background: isHovered
                            ? "url(#bar-gradient-hover)"
                            : isCurrent
                            ? "linear-gradient(to bottom, #5de3a3, #3fbf87cc)"
                            : "linear-gradient(to bottom, #3fbf87, #1a664488)",
                          boxShadow: isCurrent ? "0 0 8px rgba(63,191,135,0.4)" : undefined,
                          transform: isHovered ? "scaleX(1.1)" : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5">
                {data.map((d) => {
                  const isCurrent = d.label === CURRENT_MONTH;
                  return (
                    <div
                      key={d.month}
                      className={cn(
                        "min-w-0 flex-1 truncate text-center font-[family-name:var(--font-outfit)] text-[11px]",
                        isCurrent ? "font-semibold text-[#3fbf87]" : "text-[#6c737f]",
                      )}
                    >
                      {d.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
