"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { RangeSwitcher } from "@/components/dashboard/range-switcher";
import { TickerQuickStats } from "@/components/dashboard/ticker-quick-stats";
import { getTickerPriceHistory } from "@/app/(dashboard)/tickers/actions";
import type { ChartRange, SparklinePoint, TickerQuote } from "@/lib/dividend-data/types";

// createChart() touches document/canvas — must never run server-side.
const PriceChart = dynamic(() => import("@/components/dashboard/price-chart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-card bg-surface-2" />,
});

type TickerChartSectionProps = {
  ticker: string;
  initialRange: ChartRange;
  initialPoints: SparklinePoint[];
  isUp: boolean;
  quote: TickerQuote;
};

// A general "last timeframe you picked" preference, not per-ticker — the
// point is returning users see their preferred view immediately, same
// idea as remembering a sort order or a currency toggle.
const RANGE_STORAGE_KEY = "paidprime:ticker-chart-range";
const VALID_RANGES = new Set<ChartRange>(["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"]);

/**
 * Orchestrates the chart + range switcher: holds range state, refetches
 * on switch via the getTickerPriceHistory server action, keeps the last
 * good series on screen while a new one loads rather than flashing empty.
 */
export function TickerChartSection({ ticker, initialRange, initialPoints, isUp, quote }: TickerChartSectionProps) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [points, setPoints] = useState<SparklinePoint[]>(initialPoints);
  const [isPending, startTransition] = useTransition();

  function handleRangeChange(next: ChartRange) {
    if (next === range) return;
    setRange(next);
    try {
      localStorage.setItem(RANGE_STORAGE_KEY, next);
    } catch {
      // Best-effort only (private browsing, storage disabled, etc.) — the
      // range switcher still works, it just won't be remembered.
    }
    startTransition(async () => {
      const history = await getTickerPriceHistory(ticker, next);
      setPoints(history);
    });
  }

  // Restore the last-picked range on mount if it differs from the
  // server-rendered default — a quiet UX win, never blocks first paint
  // (the server-rendered 6mo chart is already showing by the time this
  // runs). Both state updates happen inside the transition's async
  // callback, after the fetch resolves — not synchronously in the effect
  // body — so this doesn't trigger the cascading-render pattern React's
  // linter flags for direct setState-in-effect calls.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(RANGE_STORAGE_KEY);
    } catch {
      return;
    }
    if (!stored || stored === initialRange || !VALID_RANGES.has(stored as ChartRange)) return;

    const restored = stored as ChartRange;
    startTransition(async () => {
      const history = await getTickerPriceHistory(ticker, restored);
      setRange(restored);
      setPoints(history);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  return (
    <div className="flex flex-col gap-sp-2 lg:rounded-card lg:border lg:border-border-subtle lg:bg-surface lg:p-sp-3 lg:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-sp-2">
        <RangeSwitcher active={range} onChange={handleRangeChange} disabled={isPending} />
      </div>
      <div
        className={`h-[36dvh] max-h-[380px] min-h-[180px] sm:h-[42dvh] sm:min-h-[220px] lg:h-[400px] ${isPending ? "opacity-60" : ""} transition-opacity`}
      >
        {points.length >= 2 ? (
          <PriceChart points={points} isUp={isUp} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            No price history available for this range.
          </div>
        )}
      </div>
      <div className="border-t border-border-subtle pt-sp-2">
        <TickerQuickStats quote={quote} />
      </div>
    </div>
  );
}
