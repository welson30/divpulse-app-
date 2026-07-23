import "server-only";
import { YahooFinanceProvider } from "./yahoo-finance";
import type { DividendDataProvider } from "./types";

export type { DividendEvent, DividendDataProvider, TickerQuote } from "./types";

/**
 * The single call site every consumer (the detection job, any future
 * on-demand "check this ticker" feature) should use instead of importing
 * a concrete provider directly. Swapping providers later means changing
 * one line here.
 */
export function getDividendDataProvider(): DividendDataProvider {
  return new YahooFinanceProvider();
}
