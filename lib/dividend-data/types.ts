export type DividendEvent = {
  ticker: string;
  exDate: string | null;
  payDate: string;
  amountPerShare: number;
};

export type TickerQuote = {
  ticker: string;
  price: number | null;
  currency: string | null;
  sector: string | null;
  quoteType: string | null;
  trailingAnnualDividendYield: number | null;
};

/**
 * The interface every dividend data provider implements. Isolated so the
 * unofficial Yahoo Finance provider (lib/dividend-data/yahoo-finance.ts)
 * can be swapped for a paid, SLA-backed provider later without touching
 * the detection job — see ARCHITECTURE.md §12's Yahoo Finance risk note.
 */
export interface DividendDataProvider {
  fetchDividends(ticker: string): Promise<DividendEvent[]>;
  fetchQuote(ticker: string): Promise<TickerQuote | null>;
}
