import type { SparklinePoint } from "@/lib/dividend-data/types";

/*
 * Removed 2026-08-19: `buildPortfolioSparkline` (index-aligned) and its
 * matching `scaleBenchmarkToPortfolio`. Both summed series by ARRAY INDEX,
 * which is only valid when every ticker returns an identical-length
 * series — Yahoo does not guarantee that. Measured against a real 27-ticker
 * portfolio the same day: lengths came back as 251/250/249/248/240/15/0.
 *
 * Two failures resulted. Index i meant a different calendar date per
 * ticker (KO's index 0 was 2025-08-19, a recently-added holding's index 0
 * was 2026-07-28), so the chart summed prices from unrelated dates. And
 * once a shorter series ran out, that holding silently contributed $0 for
 * the rest of the curve, so the line always drifted down toward only the
 * longest-history tickers: it ended at $18,948 against a real portfolio
 * value of $28,616, and read as -26.46% when the portfolio was actually
 * +0.34%. Invisible while the chart was hard-coded blue; obvious the
 * moment it was colored by direction.
 *
 * Use the time-aligned pair below instead — they match on real timestamps
 * and only emit a point when every holding has a value for that date.
 */

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

export type PortfolioSeries = {
  points: SparklinePoint[];
  /**
   * Held tickers left out of the window because their price history starts
   * too recently to cover it — surfaced so the UI can say so rather than
   * quietly under-reporting total value.
   */
  excluded: string[];
};

/**
 * How much of current portfolio value the holdings kept in the window must
 * represent. Requiring *every* holding to cover the window (the previous
 * behaviour) let a single newly-listed ticker dictate the whole chart: a
 * real 27-ticker portfolio had one position with 15 days of history worth
 * 0.2% of value, which clamped a year-long chart down to three weeks and
 * made every range button render the same flat line.
 */
const MIN_VALUE_COVERAGE = 0.95;

/**
 * Time-aligned, shares-weighted portfolio path, forward-filled onto the
 * union calendar. Current share counts throughout — not a reconstructed
 * book of contributions, and never a fabricated back-fill: a holding is
 * either in the window for its whole length or excluded and reported.
 *
 * Picks the longest window whose included holdings still represent
 * MIN_VALUE_COVERAGE of portfolio value, so a trivial recently-listed
 * position can't truncate the chart for everything else.
 */
export function buildPortfolioSeries(
  holdings: { ticker: string; shares: number | string }[],
  sparklineFor: (ticker: string) => SparklinePoint[],
): PortfolioSeries {
  const series = holdings
    .map((h) => ({
      ticker: h.ticker,
      shares: Number(h.shares),
      points: sortByTime(sparklineFor(h.ticker)),
    }))
    .filter((s) => s.points.length > 1 && Number.isFinite(s.shares) && s.shares > 0);

  if (series.length === 0) return { points: [], excluded: [] };

  const valueOf = (s: (typeof series)[number]) => s.shares * s.points[s.points.length - 1]!.c;
  const totalValue = series.reduce((sum, s) => sum + valueOf(s), 0);

  // Candidate window starts, earliest first. A later start qualifies more
  // holdings (higher coverage) but shortens the window, so walk from the
  // longest window down and stop at the first that still covers
  // essentially the whole portfolio.
  const candidates = [...new Set(series.map((s) => s.points[0]!.t))].sort((a, b) => a - b);

  let start = candidates[candidates.length - 1]!;
  let kept = series;
  for (const candidate of candidates) {
    const included = series.filter((s) => s.points[0]!.t <= candidate);
    const coverage = totalValue > 0 ? included.reduce((sum, s) => sum + valueOf(s), 0) / totalValue : 0;
    if (coverage >= MIN_VALUE_COVERAGE) {
      start = candidate;
      kept = included;
      break;
    }
  }

  const keptTickers = new Set(kept.map((s) => s.ticker));
  const excluded = [...new Set(series.filter((s) => !keptTickers.has(s.ticker)).map((s) => s.ticker))];

  const end = Math.max(...kept.map((s) => s.points[s.points.length - 1]!.t));
  if (end <= start) return { points: [], excluded };

  const times = new Set<number>();
  for (const s of kept) {
    for (const p of s.points) {
      if (p.t >= start && p.t <= end) times.add(p.t);
    }
  }

  const timeline = [...times].sort((a, b) => a - b);
  const points: SparklinePoint[] = [];
  for (const t of timeline) {
    let total = 0;
    let ok = true;
    for (const s of kept) {
      const value = valueAtOrBefore(s.points, t);
      if (value == null) {
        ok = false;
        break;
      }
      total += s.shares * value;
    }
    if (ok) points.push({ t, c: total });
  }

  return { points, excluded };
}

/** Rebase a benchmark onto the portfolio's starting value so both lines are comparable in dollars, matched by timestamp. Price return only — not total return. */
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
