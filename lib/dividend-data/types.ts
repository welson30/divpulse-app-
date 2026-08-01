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
  /** Fraction (0.0235 = 2.35%). Unreliable for ETFs — see lib/dividend-data/income.ts. */
  trailingAnnualDividendYield: number | null;
  /**
   * Yahoo's other yield field, already expressed as a percentage
   * (2.4 = 2.4%) rather than a fraction. Populated far more often than
   * trailingAnnualDividendYield and accurate for conventional payers,
   * but still badly wrong for weekly option-income funds (it reports
   * 2.04% for QDTE against a real ~47%). Fine for browsing curated
   * collections; never use it to compute a user's actual income.
   */
  dividendYieldPercent: number | null;
  /** Display name, e.g. "Invesco NASDAQ 100 ETF" — a bare ticker like QQQM means nothing to most people. */
  name: string | null;
  /** Absolute and percentage move against the previous close; drives the red/green treatment. */
  change: number | null;
  changePercent: number | null;

  // --- market-depth fields, populated by the batch endpoint only ---
  /** "REGULAR" | "PRE" | "POST" | "CLOSED" | "PREPRE" | "POSTPOST" */
  marketState: string | null;
  /** 0 means the feed is real-time rather than delayed. */
  exchangeDelayMinutes: number | null;
  exchangeName: string | null;
  previousClose: number | null;
  open: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  /** Move over the past year, as a percentage. */
  fiftyTwoWeekChangePercent: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  volume: number | null;
  averageVolume3Month: number | null;

  // --- deep stats, populated only via fetchQuote's quoteSummary call.
  // Single-company fundamentals — expect these null for most ETFs/funds,
  // which is the common case for a dividend-focused portfolio, not an
  // edge case. Never default a missing value to 0; render "—" instead. ---
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  /** Share of earnings paid out as dividends, as a fraction (0.65 = 65%). */
  payoutRatio: number | null;
  beta: number | null;
  priceToBook: number | null;
  /** Absolute $/share expected over the next year — distinct from the yield fields above. */
  dividendRate: number | null;
  exDividendDate: string | null;

  // --- fund size / cost, populated by the batch endpoint, ETFs/funds only ---
  /** Fund AUM in dollars — the fund-world equivalent of marketCap, absent for equities. */
  netAssets: number | null;
  /** Already a percentage (0.06 = 0.06%), not a fraction — format directly, don't multiply by 100. */
  netExpenseRatio: number | null;

  // --- extended-hours pricing, populated by the batch endpoint when
  // hasPrePostMarketData is true. Only one side is ever populated at a
  // time — post* during POST/POSTPOST market state, pre* during
  // PRE/PREPRE — matching whichever session is currently active. ---
  postMarketPrice: number | null;
  postMarketChange: number | null;
  postMarketChangePercent: number | null;
  preMarketPrice: number | null;
  preMarketChange: number | null;
  preMarketChangePercent: number | null;
};

/** One closing price on the sparkline series. `t` is a unix timestamp in seconds. */
export type SparklinePoint = { t: number; c: number };

export type SparklineRange = "1d" | "5d" | "1mo" | "6mo" | "1y";

/**
 * Range for a full historical price chart (ticker detail page) — kept
 * separate from SparklineRange rather than widening it, since 5y/max
 * ranges aren't meaningful for a 24px inline list sparkline. The two
 * concerns (decorative list sparkline vs. real historical chart) evolve
 * independently on purpose.
 */
export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";

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
  /** Full-resolution price history for one ticker's detail-page chart. */
  fetchPriceHistory(ticker: string, range: ChartRange): Promise<SparklinePoint[]>;
}
