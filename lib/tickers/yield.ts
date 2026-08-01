import type { TickerQuote } from "@/lib/dividend-data/types";

/**
 * dividendYieldPercent arrives already as a percentage and is accurate for
 * conventional payers; trailingAnnualDividendYield is a fraction and reads
 * 0 for most funds, which is why it's only the fallback. Shared by every
 * page/action that renders a yield figure from a quote (Collections list,
 * collection detail, collection search) so the formula only lives once.
 */
export function getYieldPct(quote: TickerQuote | null | undefined): number | null {
  if (quote?.dividendYieldPercent != null) return quote.dividendYieldPercent / 100;
  return quote?.trailingAnnualDividendYield ?? null;
}
