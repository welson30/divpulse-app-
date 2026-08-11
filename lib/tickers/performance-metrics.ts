import type { SparklinePoint } from "@/lib/dividend-data/types";

export type MaxDrawdown = {
  pct: number;
  peakT: number;
  troughT: number;
};

export type YearlyReturnRow = {
  year: number;
  portfolio: number | null;
  spy: number | null;
  partial: boolean;
};

export function sliceLastDays(points: SparklinePoint[], days: number): SparklinePoint[] {
  if (days <= 0 || points.length < 2) return points;
  const last = points[points.length - 1]!.t;
  const sliced = points.filter((p) => p.t >= last - days * 86400);
  return sliced.length >= 2 ? sliced : points;
}

export function periodReturn(points: SparklinePoint[]): number | null {
  if (points.length < 2) return null;
  const start = points[0]!.c;
  const end = points[points.length - 1]!.c;
  if (!(start > 0)) return null;
  return end / start - 1;
}

export function spanDays(points: SparklinePoint[]): number | null {
  if (points.length < 2) return null;
  return (points[points.length - 1]!.t - points[0]!.t) / 86400;
}

export function annualizedReturn(points: SparklinePoint[]): number | null {
  const ret = periodReturn(points);
  const days = spanDays(points);
  if (ret == null || days == null || days < 30) return null;
  return (1 + ret) ** (365.25 / days) - 1;
}

export function maxDrawdown(points: SparklinePoint[]): MaxDrawdown | null {
  let peak = -Infinity;
  let peakT = 0;
  let worst = 0;
  let worstPeakT = 0;
  let worstTroughT = 0;
  for (const p of points) {
    if (p.c > peak) {
      peak = p.c;
      peakT = p.t;
    }
    if (peak > 0) {
      const dd = p.c / peak - 1;
      if (dd < worst) {
        worst = dd;
        worstPeakT = peakT;
        worstTroughT = p.t;
      }
    }
  }
  if (worst >= 0) return null;
  return { pct: worst, peakT: worstPeakT, troughT: worstTroughT };
}

function inferredPeriodsPerYear(points: SparklinePoint[]): number {
  if (points.length < 3) return 52;
  const gaps: number[] = [];
  const n = Math.min(points.length, 24);
  for (let i = 1; i < n; i += 1) {
    gaps.push(points[i]!.t - points[i - 1]!.t);
  }
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)]!;
  if (median < 2 * 86400) return 252;
  if (median < 10 * 86400) return 52;
  return 12;
}

export function annualizedVolatility(points: SparklinePoint[]): number | null {
  if (points.length < 8) return null;
  const returns: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!.c;
    if (prev > 0) returns.push(points[i]!.c / prev - 1);
  }
  if (returns.length < 5) return null;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  if (!(variance >= 0)) return null;
  return Math.sqrt(variance) * Math.sqrt(inferredPeriodsPerYear(points));
}

export function sharpeRatio(annReturn: number, volatility: number, riskFree: number): number | null {
  if (!(volatility > 0)) return null;
  return (annReturn - riskFree) / volatility;
}

/**
 * ^IRX prints as an annualized percent (4.3). Guard the rare decimal quote.
 */
export function riskFreeFromIrxPrice(price: number | null | undefined): number | null {
  if (price == null || !Number.isFinite(price) || price < 0) return null;
  if (price <= 0.25) return price;
  if (price <= 20) return price / 100;
  return null;
}

function utcYear(t: number): number {
  return new Date(t * 1000).getUTCFullYear();
}

function yearReturn(points: SparklinePoint[], year: number): { ret: number; partial: boolean } | null {
  const inYear = points.filter((p) => utcYear(p.t) === year);
  if (inYear.length < 2) return null;
  const first = inYear[0]!;
  const last = inYear[inYear.length - 1]!;
  if (!(first.c > 0)) return null;
  const yearStart = Date.UTC(year, 0, 1) / 1000;
  const yearEnd = Date.UTC(year, 11, 31) / 1000;
  const windowEnd = Math.min(yearEnd, Date.now() / 1000);
  const partial = first.t > yearStart + 21 * 86400 || last.t < windowEnd - 21 * 86400;
  return { ret: last.c / first.c - 1, partial };
}

export function calendarYearReturns(
  portfolio: SparklinePoint[],
  spy: SparklinePoint[],
): YearlyReturnRow[] {
  const years = new Set<number>();
  for (const p of portfolio) years.add(utcYear(p.t));
  return [...years]
    .sort((a, b) => a - b)
    .flatMap((year) => {
      const port = yearReturn(portfolio, year);
      if (port == null) return [];
      const bench = yearReturn(spy, year);
      return [
        {
          year,
          portfolio: port.ret,
          spy: bench?.ret ?? null,
          partial: port.partial || Boolean(bench?.partial),
        },
      ];
    });
}
