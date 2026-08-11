"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { SparklinePoint } from "@/lib/dividend-data/types";

const Chart = dynamic(
  () => import("@/components/dashboard/portfolio-performance-chart").then((m) => m.PortfolioPerformanceChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-[10px] bg-[#16191d]" />,
  },
);

const RANGES = [
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "ALL", days: null },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

function slicePoints(points: SparklinePoint[], days: number | null): SparklinePoint[] {
  if (days == null || points.length < 2) return points;
  const last = points[points.length - 1]!.t;
  const cutoff = last - days * 86400;
  const sliced = points.filter((p) => p.t >= cutoff);
  return sliced.length >= 2 ? sliced : points;
}

type PerformanceVsBenchmarkCardProps = {
  points: SparklinePoint[];
  benchmarkPoints: SparklinePoint[];
};

export function PerformanceVsBenchmarkCard({ points, benchmarkPoints }: PerformanceVsBenchmarkCardProps) {
  const [range, setRange] = useState<RangeId>("1Y");
  const [showBenchmark, setShowBenchmark] = useState(true);

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? null;
    return slicePoints(points, days);
  }, [points, range]);

  const visibleBench = useMemo(() => {
    if (!showBenchmark) return [];
    const days = RANGES.find((r) => r.id === range)?.days ?? null;
    return slicePoints(benchmarkPoints, days);
  }, [benchmarkPoints, range, showBenchmark]);

  return (
    <section className="flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]">
      <header className="flex flex-col gap-3 border-b border-[#22262c] px-5 py-5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-4 min-[900px]:px-6">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            Performance vs benchmark
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
            Portfolio value against S&amp;P 500 (SPY)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBenchmark((v) => !v)}
            className={cn(
              "rounded-[10px] border px-[11.8px] py-[5px] text-[11px] tracking-[1.1px] uppercase",
              showBenchmark
                ? "border-[rgba(76,130,247,0.4)] bg-[#16233d] text-[#4c82f7]"
                : "border-[#22262c] bg-[#0b0c0e] text-[#6c737f] hover:text-[#99a1ac]",
            )}
          >
            Benchmark
          </button>
          <div
            role="group"
            aria-label="Chart range"
            className="flex shrink-0 items-start gap-1 rounded-[10px] border border-[#22262c] bg-[#0b0c0e] p-[3.8px]"
          >
            {RANGES.map((r) => {
              const active = r.id === range;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "rounded-[8px] px-2.5 py-[3.3px] text-center text-[11px] tracking-[1.1px] uppercase",
                    active ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#6c737f] hover:text-[#99a1ac]",
                  )}
                >
                  {r.id}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <div className="h-[240px] w-full px-2 pb-4 pt-2 min-[900px]:h-[280px] min-[900px]:px-3">
        {visible.length < 2 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[#99a1ac]">
            Not enough price history to plot a trend yet.
          </div>
        ) : (
          <Chart points={visible} benchmarkPoints={visibleBench} />
        )}
      </div>
    </section>
  );
}
