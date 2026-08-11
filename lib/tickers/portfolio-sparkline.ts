import type { SparklinePoint } from "@/lib/dividend-data/types";

/**
 * Index-aligned, shares-weighted sum of each holding's sparkline.
 * Same idea as summing live portfolio value — not a fabricated curve.
 */
export function buildPortfolioSparkline(
  holdings: { ticker: string; shares: number | string }[],
  sparklineFor: (ticker: string) => SparklinePoint[],
): SparklinePoint[] {
  const series = holdings
    .map((h) => ({ shares: Number(h.shares), points: sparklineFor(h.ticker) }))
    .filter((s) => s.points.length > 1);

  if (series.length === 0) return [];

  const longest = series.reduce((a, b) => (b.points.length > a.points.length ? b : a)).points;
  const aggregate: SparklinePoint[] = [];
  for (let i = 0; i < longest.length; i += 1) {
    let total = 0;
    let any = false;
    for (const s of series) {
      const point = s.points[i];
      if (point) {
        total += s.shares * point.c;
        any = true;
      }
    }
    if (any) aggregate.push({ t: longest[i]!.t, c: total });
  }
  return aggregate;
}

/**
 * Rebase a benchmark price series onto the portfolio's starting value so
 * both lines are comparable in dollars. Price return only — not total return.
 */
export function scaleBenchmarkToPortfolio(
  portfolio: SparklinePoint[],
  benchmark: SparklinePoint[],
): SparklinePoint[] {
  if (portfolio.length < 2 || benchmark.length < 2) return [];
  const start = portfolio[0]!.c;
  const b0 = benchmark[0]!.c;
  if (!(b0 > 0) || !(start > 0)) return [];

  const n = Math.min(portfolio.length, benchmark.length);
  const out: SparklinePoint[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = portfolio[i];
    const b = benchmark[i];
    if (!p || !b) continue;
    out.push({ t: p.t, c: start * (b.c / b0) });
  }
  return out;
}

const STALE_SECONDS = 21 * 86400;

function sortByTime(points: SparklinePoint[]): SparklinePoint[] {
  return [...points].sort((a, b) => a.t - b.t);
}

/** Last close at or before `t`, ignoring quotes older than three weeks. */
export function valueAtOrBefore(points: SparklinePoint[], t: number): number | null {
  let lo = 0;
  let hi = points.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.t <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (ans < 0) return null;
  const point = points[ans]!;
  if (t - point.t > STALE_SECONDS) return null;
  return point.c;
}

/**
 * Time-aligned, shares-weighted portfolio path. Uses the overlapping
 * window every holding actually has history for, then forward-fills each
 * ticker to the union calendar. Current share counts throughout — not a
 * reconstructed book of contributions.
 */
export function buildPortfolioSparklineAligned(
  holdings: { ticker: string; shares: number | string }[],
  sparklineFor: (ticker: string) => SparklinePoint[],
): SparklinePoint[] {
  const series = holdings
    .map((h) => ({ shares: Number(h.shares), points: sortByTime(sparklineFor(h.ticker)) }))
    .filter((s) => s.points.length > 1 && Number.isFinite(s.shares) && s.shares > 0);

  if (series.length === 0) return [];

  const start = Math.max(...series.map((s) => s.points[0]!.t));
  const end = Math.min(...series.map((s) => s.points[s.points.length - 1]!.t));
  if (end <= start) return [];

  const times = new Set<number>();
  for (const s of series) {
    for (const p of s.points) {
      if (p.t >= start && p.t <= end) times.add(p.t);
    }
  }
  const timeline = [...times].sort((a, b) => a - b);
  const aggregate: SparklinePoint[] = [];
  for (const t of timeline) {
    let total = 0;
    let ok = true;
    for (const s of series) {
      const value = valueAtOrBefore(s.points, t);
      if (value == null) {
        ok = false;
        break;
      }
      total += s.shares * value;
    }
    if (ok) aggregate.push({ t, c: total });
  }
  return aggregate;
}

/** Same rebase as `scaleBenchmarkToPortfolio`, matched by timestamp. */
export function scaleBenchmarkAligned(
  portfolio: SparklinePoint[],
  benchmark: SparklinePoint[],
): SparklinePoint[] {
  if (portfolio.length < 2 || benchmark.length < 2) return [];
  const start = portfolio[0]!.c;
  const spy = sortByTime(benchmark);
  const b0 = valueAtOrBefore(spy, portfolio[0]!.t);
  if (!(start > 0) || b0 == null || !(b0 > 0)) return [];

  const out: SparklinePoint[] = [];
  for (const p of portfolio) {
    const b = valueAtOrBefore(spy, p.t);
    if (b == null) continue;
    out.push({ t: p.t, c: start * (b / b0) });
  }
  return out.length >= 2 ? out : [];
}
