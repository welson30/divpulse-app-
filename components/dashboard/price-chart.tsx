"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { SparklinePoint } from "@/lib/dividend-data/types";

// Literal hex, not CSS var references — lightweight-charts renders to
// canvas and can't resolve var(--green-500)/var(--red-500). Keep these
// in sync with app/globals.css if the palette ever changes.
const GREEN = "#22C55E";
const RED = "#F87171";
// border-subtle (#303034) at ~10% alpha — gridlines should read as a
// faint texture, not a competing line weight against the price series.
const GRID_LINE = "#3030341A";
const AXIS_BORDER = "#303034";
const AXIS_TEXT = "#A1A1AA";

type PriceChartProps = {
  points: SparklinePoint[];
  isUp: boolean;
};

/**
 * Thin wrapper around lightweight-charts. Only ever rendered via
 * ticker-chart-section.tsx through next/dynamic({ ssr: false }) —
 * createChart() touches document/canvas and can't run server-side, so
 * this file must never be imported directly from a server component.
 *
 * vertTouchDrag is deliberately off: this chart lives inside AppShell's
 * scrollable main, and without it a touch drag on the chart would hijack
 * the page's vertical scroll instead of letting it through.
 */
export function PriceChart({ points, isUp }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const color = isUp ? GREEN : RED;
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: AXIS_TEXT,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: GRID_LINE, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: AXIS_BORDER },
      timeScale: { borderColor: AXIS_BORDER, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { labelBackgroundColor: color },
        horzLine: { labelBackgroundColor: color },
      },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}4D`, // ~30% opacity
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [isUp]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(points.map((p) => ({ time: p.t as UTCTimestamp, value: p.c })));
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-full w-full" />;
}
