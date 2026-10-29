"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";

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
  title,
  subtitle,
  chartClassName,
}: {
  data: MonthlyIncomePoint[];
  className?: string;
  title?: string;
  subtitle?: string;
  chartClassName?: string;
}) {
  const t = useTranslations("dashboard.passiveIncome");
  const resolvedTitle = title ?? t("title");
  const resolvedSubtitle = subtitle ?? t("subtitle");
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));
  const avgTotal = data.length > 0 ? data.reduce((s, d) => s + d.total, 0) / data.length : 0;

  const hoveredData = hoveredMonth ? data.find((x) => x.month === hoveredMonth) : null;

  return (
    <section className={cn("flex flex-col rounded-[18px] border border-[#1c2028] bg-[#0b0e12] shadow-[0_8px_40px_rgba(0,0,0,0.4)]", className)}>
      <header className="border-b border-[#1a1e26] px-5 py-5 min-[900px]:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#e8eaf0]">
              {resolvedTitle}
            </h2>
            <p className="mt-1 text-[12px] leading-[1.65] text-[#3d4554]">{resolvedSubtitle}</p>
          </div>
          {/* Live average badge */}
          {avgTotal > 0 && (
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[10px] font-medium tracking-[1.5px] text-[#3d4554] uppercase">avg / mo</span>
              <span className="font-mono text-[14px] font-semibold text-[#3fbf87]" style={{ filter: "drop-shadow(0 0 8px rgba(63,191,135,0.4))" }}>
                {formatAxis(avgTotal)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tooltip */}
      <div
        className={cn(
          "mx-4 overflow-hidden transition-all duration-200 min-[900px]:mx-6",
          hoveredData ? "mt-3 max-h-12 opacity-100" : "mt-0 max-h-0 opacity-0",
        )}
      >
        {hoveredData && (
          <div className="flex items-center justify-between rounded-xl border border-[#1c2028] bg-[#0f1318] px-4 py-2.5">
            <span className="text-[12px] font-medium text-[#5a6270]">{hoveredData.label}</span>
            <span className="font-mono text-[15px] font-bold text-[#3fbf87]" style={{ filter: "drop-shadow(0 0 8px rgba(63,191,135,0.5))" }}>
              ${hoveredData.total.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-5 pt-3 min-[900px]:px-6">
        {max <= 0 ? (
          <div className={cn("flex h-[220px] items-center justify-center text-center text-[13px] text-[#3d4554] min-[900px]:h-[260px]", chartClassName)}>
            {t("emptyState")}
          </div>
        ) : (
          <div className={cn("flex h-[220px] gap-2 min-[900px]:h-[260px]", chartClassName)}>
            {/* Y-axis */}
            <div className="flex w-9 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right font-mono text-[10px] text-[#2a3040]">
              {ticks.map((t) => (
                <span key={t.p}>{t.label}</span>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 items-end gap-1">
                {/* Grid lines */}
                {ticks.map((t) => (
                  <div
                    key={t.p}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-[#141820]"
                    style={{ bottom: `${t.p * 100}%` }}
                  />
                ))}

                {/* Average dashed line */}
                {avgTotal > 0 && (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 z-[2] border-t border-dashed border-[#3fbf87]/25"
                    style={{ bottom: `${(avgTotal / niceMax) * 100}%` }}
                  />
                )}

                {/* Bars */}
                {data.map((d, idx) => {
                  const heightPct = niceMax > 0 ? (d.total / niceMax) * 100 : 0;
                  const isCurrent = d.label === CURRENT_MONTH;
                  const isHovered = hoveredMonth === d.month;
                  const isTallest = d.total === max;

                  return (
                    <div
                      key={d.month}
                      className="relative z-[1] flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end"
                      onMouseEnter={() => setHoveredMonth(d.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      {/* Glow behind tallest bar */}
                      {isTallest && (
                        <div
                          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] rounded-full opacity-30 blur-xl"
                          style={{
                            height: `${heightPct * 0.6}%`,
                            background: "radial-gradient(ellipse, #3fbf87 0%, transparent 70%)",
                          }}
                        />
                      )}

                      <div
                        className="w-full max-w-[26px] rounded-t-[5px] origin-bottom"
                        style={{
                          height: mounted ? `${Math.max(heightPct, 1.5)}%` : "0%",
                          transition: `height 0.65s cubic-bezier(0.34,1.4,0.64,1) ${idx * 35}ms`,
                          background: isHovered
                            ? "linear-gradient(to bottom, #7eefc0, #3fbf87)"
                            : isCurrent
                            ? "linear-gradient(to bottom, #5de3a3, #3fbf87bb)"
                            : "linear-gradient(to bottom, #2d8c60, #1a5c3e88)",
                          boxShadow: isCurrent
                            ? "0 0 16px rgba(63,191,135,0.5), 0 0 4px rgba(63,191,135,0.8)"
                            : isHovered
                            ? "0 0 10px rgba(63,191,135,0.35)"
                            : undefined,
                          transform: isHovered ? "scaleX(1.12)" : "scaleX(1)",
                          filter: isHovered ? "brightness(1.15)" : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="mt-2 flex gap-1">
                {data.map((d) => {
                  const isCurrent = d.label === CURRENT_MONTH;
                  return (
                    <div
                      key={d.month}
                      className="min-w-0 flex-1 truncate text-center font-mono text-[10px]"
                      style={{
                        color: isCurrent ? "#3fbf87" : "#2a3040",
                        fontWeight: isCurrent ? 700 : 400,
                        filter: isCurrent ? "drop-shadow(0 0 6px rgba(63,191,135,0.6))" : undefined,
                      }}
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
