"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";
import type { AnnualIncomePoint } from "@/components/dashboard/dividend-growth-chart";
import type { SparklinePoint } from "@/lib/dividend-data/types";

type RangeId = "3M" | "6M" | "1Y" | "3Y" | "All";

const RANGES: { id: RangeId; months: number | null; days: number | null; compareMonths: number }[] = [
  { id: "3M", months: 3, days: 90, compareMonths: 3 },
  { id: "6M", months: 6, days: 180, compareMonths: 6 },
  { id: "1Y", months: 12, days: 365, compareMonths: 12 },
  { id: "3Y", months: 36, days: 365 * 3, compareMonths: 12 },
  { id: "All", months: null, days: null, compareMonths: 12 },
];

function niceCeiling(max: number): number {
  if (max <= 0) return 100;
  const padded = max * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatMoneyAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPctAxis(value: number): string {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatGrowth(value: number | null): string | null {
  if (value == null) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function windowGrowth(totals: number[], window: number): number | null {
  if (window <= 0 || totals.length < window * 2) return null;
  const recent = totals.slice(-window).reduce((sum, n) => sum + n, 0);
  const prior = totals.slice(-window * 2, -window).reduce((sum, n) => sum + n, 0);
  if (prior <= 0) return null;
  return ((recent - prior) / prior) * 100;
}

function sliceMonthly(points: MonthlyIncomePoint[], months: number | null): MonthlyIncomePoint[] {
  if (months == null || points.length <= months) return points;
  return points.slice(-months);
}

function sliceSparkline(points: SparklinePoint[], days: number | null): SparklinePoint[] {
  if (days == null || points.length < 2) return points;
  const last = points[points.length - 1]!.t;
  const sliced = points.filter((p) => p.t >= last - days * 86400);
  return sliced.length >= 2 ? sliced : points;
}

function buildYieldSeries(monthly: MonthlyIncomePoint[], sparkline: SparklinePoint[]): MonthlyIncomePoint[] {
  if (sparkline.length < 2) return [];
  return monthly.flatMap((point, index) => {
    if (index < 11) return [];
    const ttm = monthly.slice(index - 11, index + 1).reduce((sum, p) => sum + p.total, 0);
    const monthEnd = Date.parse(`${point.month}-01T00:00:00Z`) / 1000 + 32 * 86400;
    let value: SparklinePoint | null = null;
    for (const p of sparkline) {
      if (p.t <= monthEnd && (!value || p.t > value.t)) value = p;
    }
    if (!value || value.c <= 0 || ttm <= 0) return [];
    return [{ ...point, total: (ttm / value.c) * 100 }];
  });
}

export function AnalyticsBoard({
  monthly,
  annual,
  portfolio,
}: {
  monthly: MonthlyIncomePoint[];
  annual: AnnualIncomePoint[];
  portfolio: SparklinePoint[];
}) {
  const [range, setRange] = useState<RangeId>("1Y");
  const spec = RANGES.find((r) => r.id === range) ?? RANGES[2]!;

  const monthlyVisible = useMemo(() => sliceMonthly(monthly, spec.months), [monthly, spec.months]);
  const annualVisible = useMemo(() => {
    if (spec.id === "3M" || spec.id === "6M" || spec.id === "1Y") {
      const years = spec.id === "1Y" ? 2 : 1;
      return annual.slice(-Math.max(years, 2));
    }
    if (spec.id === "3Y") return annual.slice(-3);
    return annual.filter((p, i) => p.total > 0 || annual.slice(0, i).some((x) => x.total > 0));
  }, [annual, spec.id]);
  const portfolioVisible = useMemo(() => sliceSparkline(portfolio, spec.days), [portfolio, spec.days]);
  const yieldFull = useMemo(() => buildYieldSeries(monthly, portfolio), [monthly, portfolio]);
  const yieldVisible = useMemo(() => sliceMonthly(yieldFull, spec.months), [yieldFull, spec.months]);

  const incomeGrowth = windowGrowth(
    monthly.map((p) => p.total),
    spec.compareMonths,
  );
  const completeYears = annual.filter((p) => p.complete && p.total > 0);
  const yoy =
    completeYears.length >= 2 && completeYears.at(-2)!.total > 0
      ? ((completeYears.at(-1)!.total - completeYears.at(-2)!.total) / completeYears.at(-2)!.total) * 100
      : null;

  const yearlyBars: MonthlyIncomePoint[] = annualVisible.map((p) => ({
    month: String(p.year),
    label: String(p.year),
    total: p.total,
  }));

  const portfolioAsMonthly: MonthlyIncomePoint[] = portfolioVisible.map((p, i) => {
    const d = new Date(p.t * 1000);
    return {
      month: `${i}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      total: p.c,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-[#22262c] pb-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Insights</p>
          <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
            Analytics
          </h1>
          <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
            Every trend behind your passive income, in one production-grade grid.
          </p>
        </div>
        <div
          role="group"
          aria-label="Chart range"
          className="flex shrink-0 items-center rounded-[10px] border border-[#22262c] bg-[#0b0c0e] p-1"
        >
          {RANGES.map((r) => {
            const active = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium",
                  active ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#6c737f] hover:text-[#99a1ac]",
                )}
              >
                {r.id}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-2">
        <ChartCard title="Income growth" subtitle={`Trailing income · ${range}`} badge={formatGrowth(incomeGrowth)}>
          <AreaChart data={monthlyVisible} color="#4c82f7" formatAxis={formatMoneyAxis} />
        </ChartCard>
        <ChartCard
          title="Dividend growth"
          subtitle="Annual income received, year over year"
          badge={yoy != null ? `${formatGrowth(yoy)} YoY` : null}
        >
          <AreaChart
            data={annualVisible.map((p) => ({ month: String(p.year), label: String(p.year), total: p.total }))}
            color="#3fbf87"
            formatAxis={formatMoneyAxis}
          />
        </ChartCard>
        <ChartCard title="Monthly income" subtitle="Cash received per month">
          <BarChart data={monthlyVisible} color="#3fbf87" formatAxis={formatMoneyAxis} />
        </ChartCard>
        <ChartCard title="Yearly income" subtitle="Annual dividend income totals">
          <BarChart data={yearlyBars} color="#3fbf87" formatAxis={formatMoneyAxis} />
        </ChartCard>
        <ChartCard title="Yield trend" subtitle="Blended trailing yield (TTM income / portfolio value)">
          <AreaChart data={yieldVisible} color="#4c82f7" formatAxis={formatPctAxis} />
        </ChartCard>
        <ChartCard title="Cash flow" subtitle="Net dividend cash flow by month">
          <BarChart data={monthlyVisible} color="#3fbf87" formatAxis={formatMoneyAxis} />
        </ChartCard>
      </div>

      <ChartCard
        title="Historical performance"
        subtitle={
          portfolioVisible.length >= 2
            ? "Total portfolio value from available price history"
            : "Total portfolio value"
        }
        wide
      >
        <AreaChart data={portfolioAsMonthly} color="#4c82f7" formatAxis={formatMoneyAxis} height={280} sparseLabels />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  badge,
  wide,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string | null;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]", wide && "min-[1100px]:col-span-2")}>
      <header className="flex items-start justify-between gap-3 border-b border-[#22262c] px-6 py-5">
        <div>
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            {title}
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{subtitle}</p>
        </div>
        {badge ? (
          <span
            className={cn(
              "mt-1 shrink-0 rounded-[8px] border px-2 py-[4px] text-[11px] tracking-[1.1px] uppercase",
              badge.startsWith("-")
                ? "border-[rgba(216,105,95,0.3)] bg-[#2a1614] text-[#d8695f]"
                : "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
            )}
          >
            {badge}
          </span>
        ) : null}
      </header>
      <div className="px-4 py-4 min-[900px]:px-6">{children}</div>
    </section>
  );
}

function AreaChart({
  data,
  color,
  formatAxis,
  height = 240,
  sparseLabels = false,
}: {
  data: MonthlyIncomePoint[];
  color: string;
  formatAxis: (value: number) => string;
  height?: number;
  sparseLabels?: boolean;
}) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  if (data.length < 2 || max <= 0) {
    return (
      <div className="flex items-center justify-center text-center text-[13px] text-[#99a1ac]" style={{ height }}>
        Not enough history in this range.
      </div>
    );
  }
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));
  const xFor = (i: number) => (data.length <= 1 ? 50 : (i / (data.length - 1)) * 100);
  const yFor = (v: number) => 100 - (v / niceMax) * 100;
  const line = data.map((d, i) => `${xFor(i)},${yFor(d.total)}`).join(" ");
  const fill = `0,100 ${line} 100,100`;
  const labelEvery = sparseLabels ? Math.max(1, Math.ceil(data.length / 8)) : 1;

  return (
    <div className="flex gap-2" style={{ height }}>
      <div className="flex w-10 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right text-[11px] text-[#6c737f]">
        {ticks.map((t) => (
          <span key={t.p}>{t.label}</span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          {ticks.map((t) => (
            <div key={t.p} aria-hidden className="absolute inset-x-0 border-t border-[#22262c]" style={{ bottom: `${t.p * 100}%` }} />
          ))}
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={fill} fill={color} fillOpacity={0.16} />
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="mt-2 flex">
          {data.map((d, i) => (
            <div key={d.month} className="min-w-0 flex-1 truncate text-center text-[11px] text-[#6c737f]">
              {i % labelEvery === 0 ? d.label : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({
  data,
  color,
  formatAxis,
}: {
  data: MonthlyIncomePoint[];
  color: string;
  formatAxis: (value: number) => string;
}) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  if (max <= 0) {
    return <div className="flex h-[240px] items-center justify-center text-center text-[13px] text-[#99a1ac]">Not enough history in this range.</div>;
  }
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));

  return (
    <div className="flex h-[240px] gap-2">
      <div className="flex w-10 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right text-[11px] text-[#6c737f]">
        {ticks.map((t) => (
          <span key={t.p}>{t.label}</span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 items-end gap-1.5">
          {ticks.map((t) => (
            <div key={t.p} aria-hidden className="absolute inset-x-0 border-t border-[#22262c]" style={{ bottom: `${t.p * 100}%` }} />
          ))}
          {data.map((d) => (
            <div key={d.month} className="relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-end">
              <div
                className="w-full max-w-[22px] rounded-t-[3px]"
                style={{ height: `${Math.max((d.total / niceMax) * 100, 2)}%`, backgroundColor: color }}
                title={`${d.label}: ${formatAxis(d.total)}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {data.map((d) => (
            <div key={d.month} className="min-w-0 flex-1 truncate text-center text-[11px] text-[#6c737f]">
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
