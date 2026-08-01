import "server-only";
import type {
  ChartRange,
  DividendDataProvider,
  DividendEvent,
  SparklinePoint,
  SparklineRange,
  TickerQuote,
} from "./types";

// Unofficial endpoint — no API key, no published SLA, no documented rate
// limits. This is the sole reason the DividendDataProvider interface
// exists: if Yahoo changes or throttles this endpoint, only this file
// needs to change. See ARCHITECTURE.md §12.
const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const QUOTE_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
// Batch endpoints — one request covers a whole portfolio. Both are
// unofficial like the rest of this file; /v7/finance/quote additionally
// requires the same crumb handshake quoteSummary does, /v8/finance/spark
// does not.
const BATCH_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const SPARK_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/spark";
const CRUMB_COOKIE_ENDPOINT = "https://fc.yahoo.com";
const CRUMB_ENDPOINT = "https://query1.finance.yahoo.com/v1/test/getcrumb";
const USER_AGENT = "Mozilla/5.0 (compatible; PaidPrimeBot/1.0)";

// /v8/finance/spark hard-rejects any request over 20 symbols with a 400
// ("Number of symbols needs to be less than or equal to 20") — confirmed
// live. Collections batches every ticker across every collection into one
// call and crossed this the moment a 4th collection pushed the distinct
// count to 30, silently blanking every sparkline on the page (a 400 makes
// fetchSparklines return an empty map). Applying the same cap to
// /v7/finance/quote defensively — same unofficial API family, no
// documented limit to trust either way, and a portfolio or collection set
// only grows over time.
const MAX_BATCH_SYMBOLS = 20;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

/**
 * quoteSummary (sector/yield data) requires a "crumb" token tied to a
 * session cookie — chart (prices/dividends) does not. Discovered when
 * fetchQuote started returning null for every ticker in production
 * (Yahoo added this requirement after this provider was first written).
 * Cached at module scope and only refreshed on a 401, so normal request
 * volume does the cookie+crumb handshake once per server instance
 * instead of on every quote lookup.
 */
let cachedCrumb: { crumb: string; cookie: string } | null = null;

async function fetchCrumb(): Promise<{ crumb: string; cookie: string }> {
  const cookieResponse = await fetch(CRUMB_COOKIE_ENDPOINT, {
    headers: { "User-Agent": USER_AGENT },
  });
  const setCookie = cookieResponse.headers.get("set-cookie");
  const cookie = setCookie?.split(";")[0] ?? "";

  const crumbResponse = await fetch(CRUMB_ENDPOINT, {
    headers: { "User-Agent": USER_AGENT, Cookie: cookie },
  });
  const crumb = await crumbResponse.text();

  return { crumb, cookie };
}

async function getCrumb(forceRefresh = false): Promise<{ crumb: string; cookie: string }> {
  if (!cachedCrumb || forceRefresh) {
    cachedCrumb = await fetchCrumb();
  }
  return cachedCrumb;
}

type YahooQuoteSummaryResponse = {
  quoteSummary: {
    result:
      | [
          {
            summaryProfile?: {
              sector?: string;
            };
            summaryDetail?: {
              trailingAnnualDividendYield?: { raw?: number };
              dividendRate?: { raw?: number };
              payoutRatio?: { raw?: number };
              exDividendDate?: { raw?: number }; // unix seconds
            };
            defaultKeyStatistics?: {
              marketCap?: { raw?: number };
              trailingPE?: { raw?: number };
              forwardPE?: { raw?: number };
              beta?: { raw?: number };
              priceToBook?: { raw?: number };
            };
          },
        ]
      | null;
    error: { code: string; description: string } | null;
  };
};

type YahooChartResponse = {
  chart: {
    result: [
      {
        meta?: {
          regularMarketPrice?: number;
          currency?: string;
          instrumentType?: string;
          longName?: string;
          shortName?: string;
          chartPreviousClose?: number;
          previousClose?: number;
        };
        events?: {
          dividends?: Record<
            string,
            {
              amount: number;
              date: number; // unix seconds
            }
          >;
        };
        // Only present when the chart endpoint is called for price
        // history (fetchPriceHistory) rather than fetchDividends/
        // fetchQuote, which only read meta/events.
        timestamp?: number[];
        indicators?: {
          quote?: [{ close?: (number | null)[] }];
        };
      },
    ] | null;
    error: { code: string; description: string } | null;
  };
};

type YahooBatchQuoteResponse = {
  quoteResponse?: {
    result?: Array<{
      symbol?: string;
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      currency?: string;
      quoteType?: string;
      shortName?: string;
      longName?: string;
      trailingAnnualDividendYield?: number;
      dividendYield?: number;
      marketState?: string;
      exchangeDataDelayedBy?: number;
      fullExchangeName?: string;
      regularMarketPreviousClose?: number;
      regularMarketOpen?: number;
      regularMarketDayLow?: number;
      regularMarketDayHigh?: number;
      regularMarketVolume?: number;
      fiftyTwoWeekLow?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekChangePercent?: number;
      fiftyDayAverage?: number;
      twoHundredDayAverage?: number;
      averageDailyVolume3Month?: number;
      // Fund-only — absent for equities (verified live against AAPL vs SCHD).
      netAssets?: number;
      // Already a percentage (0.06 = 0.06%), not a fraction.
      netExpenseRatio?: number;
      // Only the side matching the current session is ever present.
      hasPrePostMarketData?: boolean;
      postMarketPrice?: number;
      postMarketChange?: number;
      postMarketChangePercent?: number;
      preMarketPrice?: number;
      preMarketChange?: number;
      preMarketChangePercent?: number;
    }>;
  };
};

/** The spark endpoint answers with an object keyed by ticker, not an array. */
type YahooSparkResponse = Record<
  string,
  { symbol?: string; timestamp?: number[]; close?: (number | null)[] } | undefined
>;

const SPARK_INTERVALS: Record<SparklineRange, string> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1d",
  "6mo": "1d",
  "1y": "1d",
};

// Coarser granularity at longer ranges keeps point counts sane for a
// real chart — 5y at daily resolution is ~1260 points, at weekly ~260;
// "max" (which can span decades) goes monthly.
const CHART_INTERVALS: Record<ChartRange, string> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "5y": "1wk",
  max: "1mo",
};

// chart's instrumentType differs from quoteSummary's quoteType casing/
// vocabulary (e.g. "ETF" vs "EQUITY") — normalized so callers only ever
// see the quoteType-style values regardless of which endpoint answered.
const INSTRUMENT_TYPE_TO_QUOTE_TYPE: Record<string, string> = {
  EQUITY: "EQUITY",
  ETF: "ETF",
  MUTUALFUND: "MUTUALFUND",
};

/**
 * Yahoo Finance's unofficial chart endpoint returns dividend events keyed
 * by ex-dividend date only — it does not separately expose a pay date.
 * DividendEvent.payDate is set to the same date as a practical
 * approximation (actual payment typically follows the ex-date by 2-4
 * weeks) — this is a known limitation, not a bug. Revisit if a future
 * provider swap can supply a real pay date.
 */
export class YahooFinanceProvider implements DividendDataProvider {
  async fetchDividends(ticker: string): Promise<DividendEvent[]> {
    const oneYearAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365;
    const now = Math.floor(Date.now() / 1000);

    const url = new URL(`${CHART_ENDPOINT}/${encodeURIComponent(ticker)}`);
    url.searchParams.set("period1", String(oneYearAgo));
    url.searchParams.set("period2", String(now));
    url.searchParams.set("interval", "1d");
    url.searchParams.set("events", "div");

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PaidPrimeBot/1.0)" },
      // Deliberately uncached, unlike fetchQuote below. This is only ever
      // called by the detection job (app/api/jobs/detect-dividends), which
      // runs shortly after the 13:30 UTC market open specifically to catch
      // dividends the moment Yahoo publishes them. A cached response taken
      // even an hour earlier would be missing exactly the payout the run
      // exists to find, silently re-creating the "detected a day late"
      // bug the trailing window was added to fix. Once-a-day, ~20 tickers
      // is nowhere near enough volume to need the cache.
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance chart request failed for ${ticker}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as YahooChartResponse;

    if (data.chart.error) {
      throw new Error(`Yahoo Finance error for ${ticker}: ${data.chart.error.description}`);
    }

    const dividends = data.chart.result?.[0]?.events?.dividends;
    if (!dividends) {
      return [];
    }

    return Object.values(dividends).map((event) => {
      const isoDate = new Date(event.date * 1000).toISOString().slice(0, 10);
      return {
        ticker: ticker.toUpperCase(),
        exDate: isoDate,
        payDate: isoDate,
        amountPerShare: event.amount,
      };
    });
  }

  /**
   * price/currency/quoteType come from the unauthenticated `chart`
   * endpoint's `meta` object — no crumb needed. sector and trailing yield
   * only exist on `quoteSummary`, which requires the crumb handshake
   * above; if that handshake or request fails for any reason, this still
   * returns the chart-sourced fields instead of null, so callers degrade
   * to "no sector/yield" rather than "no data at all".
   *
   * `summaryProfile.sector` is only populated for equities — ETFs and
   * funds (quoteType "ETF"/"MUTUALFUND") don't carry a GICS sector in
   * Yahoo's data, so `sector` comes back null for those and callers
   * should fall back to grouping by quoteType instead.
   */
  async fetchQuote(ticker: string): Promise<TickerQuote | null> {
    const chartUrl = new URL(`${CHART_ENDPOINT}/${encodeURIComponent(ticker)}`);
    chartUrl.searchParams.set("range", "1d");
    chartUrl.searchParams.set("interval", "1d");

    const chartResponse = await fetch(chartUrl, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });

    if (!chartResponse.ok) {
      throw new Error(`Yahoo Finance chart request failed for ${ticker}: ${chartResponse.status} ${chartResponse.statusText}`);
    }

    const chartData = (await chartResponse.json()) as YahooChartResponse;
    if (chartData.chart.error) {
      return null;
    }

    const meta = chartData.chart.result?.[0]?.meta;
    if (!meta) {
      return null;
    }

    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const price = meta.regularMarketPrice ?? null;
    const change = price !== null && previousClose ? price - previousClose : null;

    const base: TickerQuote = {
      ticker: ticker.toUpperCase(),
      price,
      currency: meta.currency ?? null,
      sector: null,
      quoteType: meta.instrumentType ? (INSTRUMENT_TYPE_TO_QUOTE_TYPE[meta.instrumentType] ?? meta.instrumentType) : null,
      trailingAnnualDividendYield: null,
      dividendYieldPercent: null,
      name: meta.longName ?? meta.shortName ?? null,
      change,
      changePercent: change !== null && previousClose ? (change / previousClose) * 100 : null,
      // The chart endpoint's meta carries none of the market-depth
      // fields; callers needing those should use fetchQuotes.
      marketState: null,
      exchangeDelayMinutes: null,
      exchangeName: null,
      previousClose,
      open: null,
      dayLow: null,
      dayHigh: null,
      fiftyTwoWeekLow: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekChangePercent: null,
      fiftyDayAverage: null,
      twoHundredDayAverage: null,
      volume: null,
      averageVolume3Month: null,
      marketCap: null,
      trailingPE: null,
      forwardPE: null,
      payoutRatio: null,
      beta: null,
      priceToBook: null,
      dividendRate: null,
      exDividendDate: null,
      // Fund size/cost and extended-hours pricing both only come from
      // fetchQuotes' batch endpoint — see the equivalent comment above.
      netAssets: null,
      netExpenseRatio: null,
      postMarketPrice: null,
      postMarketChange: null,
      postMarketChangePercent: null,
      preMarketPrice: null,
      preMarketChange: null,
      preMarketChangePercent: null,
    };

    for (const attempt of [false, true]) {
      try {
        const { crumb, cookie } = await getCrumb(attempt);
        const summaryUrl = new URL(`${QUOTE_SUMMARY_ENDPOINT}/${encodeURIComponent(ticker)}`);
        summaryUrl.searchParams.set("modules", "summaryProfile,summaryDetail,defaultKeyStatistics");
        summaryUrl.searchParams.set("crumb", crumb);

        const summaryResponse = await fetch(summaryUrl, {
          headers: { "User-Agent": USER_AGENT, Cookie: cookie },
          next: { revalidate: 3600 },
        });

        if (summaryResponse.status === 401 && !attempt) {
          continue; // retry once with a freshly-fetched crumb
        }
        if (!summaryResponse.ok) {
          break; // give up quietly — base already has price/currency/quoteType
        }

        const summaryData = (await summaryResponse.json()) as YahooQuoteSummaryResponse;
        const result = summaryData.quoteSummary.result?.[0];
        if (result) {
          base.sector = result.summaryProfile?.sector ?? null;
          base.trailingAnnualDividendYield = result.summaryDetail?.trailingAnnualDividendYield?.raw ?? null;
          base.dividendRate = result.summaryDetail?.dividendRate?.raw ?? null;
          base.payoutRatio = result.summaryDetail?.payoutRatio?.raw ?? null;
          const exDivRaw = result.summaryDetail?.exDividendDate?.raw;
          base.exDividendDate = exDivRaw != null ? new Date(exDivRaw * 1000).toISOString().slice(0, 10) : null;
          base.marketCap = result.defaultKeyStatistics?.marketCap?.raw ?? null;
          base.trailingPE = result.defaultKeyStatistics?.trailingPE?.raw ?? null;
          base.forwardPE = result.defaultKeyStatistics?.forwardPE?.raw ?? null;
          base.beta = result.defaultKeyStatistics?.beta?.raw ?? null;
          base.priceToBook = result.defaultKeyStatistics?.priceToBook?.raw ?? null;
        }
        break;
      } catch {
        break; // network error on the enrichment step — base is still valid
      }
    }

    return base;
  }

  /**
   * Price, day change and display name for many tickers in a single
   * request. Unlike fetchQuote this does not attempt the quoteSummary
   * enrichment step, so `sector` comes back null — callers that group by
   * sector (the diversification page) still want per-ticker fetchQuote.
   * Everything driving the holdings table (price, change, name) is
   * present here.
   *
   * Note `trailingAnnualDividendYield` is carried through only for
   * compatibility; it is not trustworthy for ETFs and must not be used to
   * derive income — see lib/dividend-data/income.ts.
   */
  async fetchQuotes(tickers: string[]): Promise<Map<string, TickerQuote>> {
    const result = new Map<string, TickerQuote>();
    const symbols = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
    if (symbols.length === 0) return result;

    for (const batch of chunk(symbols, MAX_BATCH_SYMBOLS)) {
      for (const attempt of [false, true]) {
        try {
          const { crumb, cookie } = await getCrumb(attempt);
          const url = new URL(BATCH_QUOTE_ENDPOINT);
          url.searchParams.set("symbols", batch.join(","));
          url.searchParams.set("crumb", crumb);

          const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT, Cookie: cookie },
            next: { revalidate: 300 },
          });

          if (response.status === 401 && !attempt) continue; // stale crumb, retry once
          if (!response.ok) break; // give up on this batch — other batches may still succeed

          const data = (await response.json()) as YahooBatchQuoteResponse;
          for (const quote of data.quoteResponse?.result ?? []) {
            if (!quote.symbol) continue;
            result.set(quote.symbol.toUpperCase(), {
              ticker: quote.symbol.toUpperCase(),
              price: quote.regularMarketPrice ?? null,
              currency: quote.currency ?? null,
              sector: null,
              quoteType: quote.quoteType ? (INSTRUMENT_TYPE_TO_QUOTE_TYPE[quote.quoteType] ?? quote.quoteType) : null,
              trailingAnnualDividendYield: quote.trailingAnnualDividendYield ?? null,
              dividendYieldPercent: quote.dividendYield ?? null,
              name: quote.longName ?? quote.shortName ?? null,
              change: quote.regularMarketChange ?? null,
              changePercent: quote.regularMarketChangePercent ?? null,
              marketState: quote.marketState ?? null,
              exchangeDelayMinutes: quote.exchangeDataDelayedBy ?? null,
              exchangeName: quote.fullExchangeName ?? null,
              previousClose: quote.regularMarketPreviousClose ?? null,
              open: quote.regularMarketOpen ?? null,
              dayLow: quote.regularMarketDayLow ?? null,
              dayHigh: quote.regularMarketDayHigh ?? null,
              fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
              fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
              fiftyTwoWeekChangePercent: quote.fiftyTwoWeekChangePercent ?? null,
              fiftyDayAverage: quote.fiftyDayAverage ?? null,
              twoHundredDayAverage: quote.twoHundredDayAverage ?? null,
              volume: quote.regularMarketVolume ?? null,
              averageVolume3Month: quote.averageDailyVolume3Month ?? null,
              // Deep stats only come from fetchQuote's quoteSummary call —
              // this batch endpoint doesn't carry them.
              marketCap: null,
              trailingPE: null,
              forwardPE: null,
              payoutRatio: null,
              beta: null,
              priceToBook: null,
              dividendRate: null,
              exDividendDate: null,
              netAssets: quote.netAssets ?? null,
              netExpenseRatio: quote.netExpenseRatio ?? null,
              postMarketPrice: quote.postMarketPrice ?? null,
              postMarketChange: quote.postMarketChange ?? null,
              postMarketChangePercent: quote.postMarketChangePercent ?? null,
              preMarketPrice: quote.preMarketPrice ?? null,
              preMarketChange: quote.preMarketChange ?? null,
              preMarketChangePercent: quote.preMarketChangePercent ?? null,
            });
          }
          break;
        } catch {
          break; // this batch failed — other batches may still succeed
        }
      }
    }

    return result;
  }

  /**
   * Closing-price series per ticker for sparklines, batched into one
   * request. Yahoo's spark endpoint answers with an object keyed by
   * ticker rather than an array, and pads gaps (holidays, halts) with
   * nulls — those are dropped so consumers get a clean series.
   */
  async fetchSparklines(tickers: string[], range: SparklineRange = "1mo"): Promise<Map<string, SparklinePoint[]>> {
    const result = new Map<string, SparklinePoint[]>();
    const symbols = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
    if (symbols.length === 0) return result;

    for (const batch of chunk(symbols, MAX_BATCH_SYMBOLS)) {
      try {
        const url = new URL(SPARK_ENDPOINT);
        url.searchParams.set("symbols", batch.join(","));
        url.searchParams.set("range", range);
        url.searchParams.set("interval", SPARK_INTERVALS[range]);

        const response = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          next: { revalidate: 300 },
        });

        if (!response.ok) continue; // this batch failed — other batches may still succeed

        const data = (await response.json()) as YahooSparkResponse;
        for (const [symbol, series] of Object.entries(data)) {
          const timestamps = series?.timestamp ?? [];
          const closes = series?.close ?? [];
          const points: SparklinePoint[] = [];
          for (let i = 0; i < closes.length; i += 1) {
            const close = closes[i];
            const timestamp = timestamps[i];
            if (close != null && timestamp != null) points.push({ t: timestamp, c: close });
          }
          if (points.length > 0) result.set(symbol.toUpperCase(), points);
        }
      } catch {
        continue; // this batch failed — other batches may still succeed
      }
    }

    return result;
  }

  /**
   * Full-resolution price history for a single ticker's detail-page
   * chart. Hits the chart endpoint directly (same one fetchDividends/
   * fetchQuote use) with an explicit `range`, rather than stretching the
   * spark endpoint/SparklineRange beyond its decorative-list-sparkline
   * scope. No crumb needed — the chart endpoint doesn't require one.
   */
  async fetchPriceHistory(ticker: string, range: ChartRange): Promise<SparklinePoint[]> {
    try {
      const url = new URL(`${CHART_ENDPOINT}/${encodeURIComponent(ticker)}`);
      url.searchParams.set("range", range);
      url.searchParams.set("interval", CHART_INTERVALS[range]);

      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: range === "1d" || range === "5d" ? 300 : 3600 },
      });

      if (!response.ok) return [];

      const data = (await response.json()) as YahooChartResponse;
      if (data.chart.error) return [];

      const result = data.chart.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];

      const points: SparklinePoint[] = [];
      for (let i = 0; i < closes.length; i += 1) {
        const close = closes[i];
        const timestamp = timestamps[i];
        if (close != null && timestamp != null) points.push({ t: timestamp, c: close });
      }
      return points;
    } catch {
      return []; // a failed history fetch renders an empty chart, never breaks the page
    }
  }
}
