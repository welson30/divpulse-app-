import "server-only";
import { getDividendDataProvider } from "@/lib/dividend-data";
import type { SparklinePoint, SparklineRange, TickerQuote } from "@/lib/dividend-data/types";
import { resolveLogoUrl } from "./logo";

export type EnrichedTicker = {
  ticker: string;
  name: string | null;
  logoUrl: string | null;
  quote: TickerQuote | null;
  sparkline: SparklinePoint[];
  /** False for delisted symbols, expired contracts and non-traded instruments. */
  hasMarketData: boolean;
};

/**
 * One call to decorate any list of tickers with everything the UI needs:
 * name, logo, live quote and a sparkline series.
 *
 * Exists so Holdings, Watchlist, Collections and the dashboard don't each
 * re-implement the same fetch-and-zip logic — and, more importantly, so
 * they all inherit the batching. However many tickers are passed in, this
 * costs exactly two upstream requests.
 *
 * Never throws: a market-data outage renders a table without prices
 * rather than an error page.
 */
export async function enrichTickers(
  tickers: string[],
  range: SparklineRange = "1mo",
): Promise<Map<string, EnrichedTicker>> {
  const result = new Map<string, EnrichedTicker>();
  const symbols = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
  if (symbols.length === 0) return result;

  const provider = getDividendDataProvider();
  const [quotes, sparklines] = await Promise.all([
    provider.fetchQuotes(symbols).catch(() => new Map<string, TickerQuote>()),
    provider.fetchSparklines(symbols, range).catch(() => new Map<string, SparklinePoint[]>()),
  ]);

  for (const symbol of symbols) {
    const quote = quotes.get(symbol) ?? null;
    const sparkline = sparklines.get(symbol) ?? [];
    const name = quote?.name ?? null;
    result.set(symbol, {
      ticker: symbol,
      name,
      logoUrl: resolveLogoUrl(name, symbol),
      quote,
      sparkline,
      hasMarketData: quote?.price != null || sparkline.length > 0,
    });
  }

  return result;
}
