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
  /** Display name, e.g. "Invesco NASDAQ 100 ETF" — a bare ticker like QQQM means nothing to most people. */
  name: string | null;
  /** Absolute and percentage move against the previous close; drives the red/green treatment. */
  change: number | null;
  changePercent: number | null;
};

/** One closing price on the sparkline series. `t` is a unix timestamp in seconds. */
export type SparklinePoint = { t: number; c: number };

export type SparklineRange = "1d" | "5d" | "1mo" | "6mo" | "1y";

/**
 * The interface every dividend data provider implements. Isolated so the
 * unofficial Yahoo Finance provider (lib/dividend-data/yahoo-finance.ts)
 * can be swapped for a paid, SLA-backed provider later without touching
 * the detection job — see ARCHITECTURE.md §12's Yahoo Finance risk note.
 */
export interface DividendDataProvider {
  fetchDividends(ticker: string): Promise<DividendEvent[]>;
  fetchQuote(ticker: string): Promise<TickerQuote | null>;
  /**
   * Batch equivalent of fetchQuote. Every caller needs quotes for a whole
   * portfolio at once, and issuing one request per ticker against an
   * unofficial endpoint is both slow and the most likely way to get
   * throttled — a 15-holding page was making 15+ round trips.
   */
  fetchQuotes(tickers: string[]): Promise<Map<string, TickerQuote>>;
  /** Batched closing-price series, keyed by ticker, for sparklines. */
  fetchSparklines(tickers: string[], range?: SparklineRange): Promise<Map<string, SparklinePoint[]>>;
}
