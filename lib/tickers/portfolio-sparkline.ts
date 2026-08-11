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
