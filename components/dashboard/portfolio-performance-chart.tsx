"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { SparklinePoint } from "@/lib/dividend-data/types";

// Matches the app's established positive/negative tokens (same green/red
// used for KPI tone in performance-board.tsx, dividend growth, etc.).
const POSITIVE = "#3fbf87";
const NEGATIVE = "#d8695f";
const BENCH = "#99a1ac";
const GRID = "#22262c";
const AXIS = "#6c737f";

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type PortfolioPerformanceChartProps = {
  points: SparklinePoint[];
  benchmarkPoints?: SparklinePoint[];
};

/**
 * Dashboard / portfolio performance chart, plus an optional muted benchmark
 * line. Same lightweight-charts wrapper as ticker PriceChart.
 *
 * Direction-coloured: each segment renders green where the value rose from
 * the previous point and red where it fell, and its gradient fill matches.
 * AreaData carries optional per-point lineColor/topColor/bottomColor which
 * apply to the segment arriving at that point, so one series covers both the
 * stroke and the fill — no stacking a separate line over an area, and no
 * splitting the data into up/down series.
 */
export function PortfolioPerformanceChart({ points, benchmarkPoints }: PortfolioPerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const benchRef = useRef<ISeriesApi<"Line"> | null>(null);
  // Read by the crosshair subscription, which is registered once on mount
  // and so can't close over the latest props directly.
  const colorByTimeRef = useRef<Map<number, string>>(new Map());
  const overallColorRef = useRef<string>(POSITIVE);
  const appliedCrosshairColorRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: AXIS,
        fontFamily: "var(--font-outfit), Outfit, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: GRID, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.04 },
      },
      timeScale: { borderVisible: false, timeVisible: false, secondsVisible: false },
      crosshair: {
        vertLine: { labelBackgroundColor: POSITIVE },
        horzLine: { labelBackgroundColor: POSITIVE },
      },
      handleScroll: { vertTouchDrag: false },
      localization: {
        priceFormatter: (price: number) =>
          `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      },
    });

    // Per-point colours below carry the real styling; these are just the
    // fallbacks for any point that doesn't specify its own.
    const series = chart.addSeries(AreaSeries, {
      lineColor: POSITIVE,
      topColor: withAlpha(POSITIVE, 0.28),
      bottomColor: withAlpha(POSITIVE, 0),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const bench = chart.addSeries(LineSeries, {
      color: BENCH,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    });

    // Recolour the crosshair's price and date labels (and its marker dot) to
    // whichever segment is under the pointer, falling back to the range's
    // overall direction once the pointer leaves the plot. Guarded on the
    // last applied colour so an unchanged hover doesn't trigger a redraw on
    // every mouse move.
    chart.subscribeCrosshairMove((param) => {
      const hoveredTime = typeof param.time === "number" ? param.time : undefined;
      const color =
        (hoveredTime != null ? colorByTimeRef.current.get(hoveredTime) : undefined) ?? overallColorRef.current;
      if (color === appliedCrosshairColorRef.current) return;
      appliedCrosshairColorRef.current = color;

      chart.applyOptions({
        crosshair: {
          vertLine: { labelBackgroundColor: color },
          horzLine: { labelBackgroundColor: color },
        },
      });
      series.applyOptions({ crosshairMarkerBackgroundColor: color });
    });

    chartRef.current = chart;
    seriesRef.current = series;
    benchRef.current = bench;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      benchRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;

    // Index 0 has no preceding point, so it borrows the first real move's
    // colour rather than falling back to the series default and rendering
    // one odd-coloured stub at the left edge.
    const firstMove = points.length > 1 && points[1]!.c < points[0]!.c ? NEGATIVE : POSITIVE;
    const colorByTime = new Map<number, string>();
    seriesRef.current.setData(
      points.map((p, i) => {
        const color = i === 0 ? firstMove : p.c >= points[i - 1]!.c ? POSITIVE : NEGATIVE;
        colorByTime.set(p.t, color);
        return {
          time: p.t as UTCTimestamp,
          value: p.c,
          lineColor: color,
          topColor: withAlpha(color, 0.28),
          bottomColor: withAlpha(color, 0),
        };
      }),
    );
    colorByTimeRef.current = colorByTime;

    // Resting state, used whenever the pointer isn't over a segment: the
    // range's overall direction, so the chart still reads up-or-down at a
    // glance while the line itself alternates.
    const opening = points[0]?.c;
    const closing = points[points.length - 1]?.c;
    const overall = opening != null && closing != null && closing < opening ? NEGATIVE : POSITIVE;
    overallColorRef.current = overall;
    appliedCrosshairColorRef.current = overall;
    chartRef.current?.applyOptions({
      crosshair: {
        vertLine: { labelBackgroundColor: overall },
        horzLine: { labelBackgroundColor: overall },
      },
    });
    seriesRef.current.applyOptions({ crosshairMarkerBackgroundColor: overall });

    const showBench = (benchmarkPoints?.length ?? 0) >= 2;
    if (benchRef.current) {
      benchRef.current.applyOptions({ visible: showBench });
      benchRef.current.setData(
        showBench
          ? benchmarkPoints!.map((p) => ({ time: p.t as UTCTimestamp, value: p.c }))
          : [],
      );
    }
    chartRef.current?.timeScale().fitContent();
  }, [points, benchmarkPoints]);

  return <div ref={containerRef} className="h-full w-full" />;
}
