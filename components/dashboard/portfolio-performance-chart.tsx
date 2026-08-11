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

const LINE = "#4c82f7";
const BENCH = "#99a1ac";
const GRID = "#22262c";
const AXIS = "#6c737f";

type PortfolioPerformanceChartProps = {
  points: SparklinePoint[];
  benchmarkPoints?: SparklinePoint[];
};

/**
 * Dashboard / portfolio performance chart — Figma blue area series, optional
 * muted benchmark line. Same lightweight-charts wrapper as ticker PriceChart.
 */
export function PortfolioPerformanceChart({ points, benchmarkPoints }: PortfolioPerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const benchRef = useRef<ISeriesApi<"Line"> | null>(null);

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
        vertLine: { labelBackgroundColor: LINE },
        horzLine: { labelBackgroundColor: LINE },
      },
      handleScroll: { vertTouchDrag: false },
      localization: {
        priceFormatter: (price: number) =>
          `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: LINE,
      topColor: "rgba(76, 130, 247, 0.28)",
      bottomColor: "rgba(76, 130, 247, 0)",
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
    seriesRef.current.setData(points.map((p) => ({ time: p.t as UTCTimestamp, value: p.c })));

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
