"use server";

import { getDividendDataProvider } from "@/lib/dividend-data";
import type { ChartRange, SparklinePoint } from "@/lib/dividend-data/types";

/**
 * Backs the range switcher on a ticker's detail page — the page itself
 * server-renders the default range, this is only called when the user
 * picks a different one.
 */
export async function getTickerPriceHistory(ticker: string, range: ChartRange): Promise<SparklinePoint[]> {
  return getDividendDataProvider().fetchPriceHistory(ticker.toUpperCase(), range);
}
