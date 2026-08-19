import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import {
  buildPortfolioSeries,
  scaleBenchmarkAligned,
} from "@/lib/tickers/portfolio-sparkline";
import {
  annualizedReturn,
  annualizedVolatility,
  calendarYearReturns,
  maxDrawdown,
  periodReturn,
  riskFreeFromIrxPrice,
  sharpeRatio,
  sliceLastDays,
  spanDays,
  type YearlyReturnRow,
} from "@/lib/tickers/performance-metrics";
import {
  PerformanceBoard,
  type PerformanceKpi,
} from "@/components/dashboard/performance-board";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export const metadata: Metadata = {
  title: "Performance — PaidPrime",
};

const EMPTY_KPI: PerformanceKpi = {
  label: "",
  value: "—",
  hint: "Not enough price history",
  tone: "neutral",
};

function formatSignedPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function formatMonthYear(t: number): string {
  return new Date(t * 1000).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dashKpis(): [PerformanceKpi, PerformanceKpi, PerformanceKpi, PerformanceKpi] {
  return [
    { ...EMPTY_KPI, label: "Annualized return" },
    { ...EMPTY_KPI, label: "Max drawdown" },
    { ...EMPTY_KPI, label: "Volatility (σ)" },
    { ...EMPTY_KPI, label: "Sharpe ratio", hint: "No risk-free rate available" },
  ];
}

async function fetchHistories(tickers: string[]): Promise<Map<string, SparklinePoint[]>> {
  const provider = getDividendDataProvider();
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
  const entries = await Promise.all(
    unique.map(async (ticker) => [ticker, await provider.fetchPriceHistory(ticker, "5y")] as const),
  );
  return new Map(entries);
}

export default async function PerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const footer = (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
      <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
      <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
    </footer>
  );

  const { data: holdings } = await supabase.from("holdings").select("ticker, shares").eq("user_id", user!.id);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PerformanceBoard
          kpis={dashKpis()}
          chartPoints={[]}
          benchmarkPoints={[]}
          chartSubtitle="Price return, available history"
          chartBadge={null}
          yearly={[]}
        />
        {footer}
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const provider = getDividendDataProvider();
  const [histories, irxQuotes] = await Promise.all([
    fetchHistories([...tickers, "SPY"]),
    provider.fetchQuotes(["^IRX"]).catch(() => new Map()),
  ]);

  const portfolio = buildPortfolioSeries(
    holdings,
    (ticker) => histories.get(ticker.toUpperCase()) ?? [],
  ).points;
  const spy = histories.get("SPY") ?? [];
  const benchmark = scaleBenchmarkAligned(portfolio, spy);
  const chartCutoff =
    portfolio.length >= 2 ? portfolio[portfolio.length - 1]!.t - 730 * 86400 : 0;
  const chartSlice = portfolio.filter((p) => p.t >= chartCutoff);
  const chartPoints = chartSlice.length >= 2 ? chartSlice : portfolio;
  const benchSlice = benchmark.filter((p) => p.t >= chartCutoff);
  const chartBench = chartSlice.length >= 2 ? benchSlice : benchmark;

  const trailingVolPoints = sliceLastDays(portfolio, 365);
  const vol = annualizedVolatility(trailingVolPoints);
  const trailingAnn = annualizedReturn(trailingVolPoints);
  const ann = annualizedReturn(portfolio);
  const dd = maxDrawdown(portfolio);
  const days = spanDays(portfolio);
  let irxPrice: number | null = null;
  for (const [symbol, quote] of irxQuotes) {
    if (symbol.replace("^", "") === "IRX") {
      irxPrice = quote.price;
      break;
    }
  }
  const rf = riskFreeFromIrxPrice(irxPrice);
  const sharpe =
    trailingAnn != null && vol != null && rf != null ? sharpeRatio(trailingAnn, vol, rf) : null;

  const portChartRet = periodReturn(chartPoints);
  const spyChartRet = periodReturn(chartBench);
  const chartBadge =
    portChartRet != null && spyChartRet != null
      ? `${formatSignedPct(portChartRet)} vs ${formatSignedPct(spyChartRet)}`
      : portChartRet != null
        ? formatSignedPct(portChartRet)
        : null;

  const chartDays = spanDays(chartPoints);
  const chartSubtitle =
    chartDays != null && chartDays >= 600
      ? "Price return, trailing 24 months"
      : "Price return, available history";

  const yearly: YearlyReturnRow[] = calendarYearReturns(portfolio, spy);

  const volHint =
    spanDays(trailingVolPoints) != null && spanDays(trailingVolPoints)! >= 300
      ? "Trailing 12M"
      : "Over available history";

  const annHint =
    days != null && days >= 330 && days <= 400
      ? "Trailing 12M"
      : days != null
        ? `Over ${formatMonthYear(portfolio[0]!.t)} – ${formatMonthYear(portfolio[portfolio.length - 1]!.t)}`
        : "Over available price history";

  const kpis: [PerformanceKpi, PerformanceKpi, PerformanceKpi, PerformanceKpi] = [
    {
      label: "Annualized return",
      value: ann == null ? "—" : formatSignedPct(ann),
      hint: ann == null ? "Not enough price history" : annHint,
      tone: ann == null ? "neutral" : ann >= 0 ? "positive" : "negative",
    },
    {
      label: "Max drawdown",
      value: dd == null ? "—" : formatSignedPct(dd.pct),
      hint:
        dd == null
          ? portfolio.length < 2
            ? "Not enough price history"
            : "No decline in available history"
          : `${formatMonthYear(dd.peakT)} – ${formatMonthYear(dd.troughT)}`,
      tone: "neutral",
    },
    {
      label: "Volatility (σ)",
      value: vol == null ? "—" : `${(vol * 100).toFixed(1)}%`,
      hint: vol == null ? "Not enough price history" : volHint,
      tone: "neutral",
    },
    {
      label: "Sharpe ratio",
      value: sharpe == null ? "—" : sharpe.toFixed(2),
      hint:
        rf != null
          ? `Risk-free rate ${(rf * 100).toFixed(1)}%`
          : "No risk-free rate available",
      tone: "neutral",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PerformanceBoard
        kpis={kpis}
        chartPoints={chartPoints}
        benchmarkPoints={chartBench}
        chartSubtitle={chartSubtitle}
        chartBadge={chartBadge}
        yearly={yearly}
      />
      {footer}
    </div>
  );
}
