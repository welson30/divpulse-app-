import "server-only";
import type { DividendDataProvider, DividendEvent, TickerQuote } from "./types";

// Unofficial endpoint — no API key, no published SLA, no documented rate
// limits. This is the sole reason the DividendDataProvider interface
// exists: if Yahoo changes or throttles this endpoint, only this file
// needs to change. See ARCHITECTURE.md §12.
const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const QUOTE_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const CRUMB_COOKIE_ENDPOINT = "https://fc.yahoo.com";
const CRUMB_ENDPOINT = "https://query1.finance.yahoo.com/v1/test/getcrumb";
const USER_AGENT = "Mozilla/5.0 (compatible; PaidPrimeBot/1.0)";

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
      },
    ] | null;
    error: { code: string; description: string } | null;
  };
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
      // Dividend data doesn't need to be fresher than the daily cron
      // cadence — avoids hammering the unofficial endpoint on retries.
      next: { revalidate: 3600 },
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

    const base: TickerQuote = {
      ticker: ticker.toUpperCase(),
      price: meta.regularMarketPrice ?? null,
      currency: meta.currency ?? null,
      sector: null,
      quoteType: meta.instrumentType ? (INSTRUMENT_TYPE_TO_QUOTE_TYPE[meta.instrumentType] ?? meta.instrumentType) : null,
      trailingAnnualDividendYield: null,
    };

    for (const attempt of [false, true]) {
      try {
        const { crumb, cookie } = await getCrumb(attempt);
        const summaryUrl = new URL(`${QUOTE_SUMMARY_ENDPOINT}/${encodeURIComponent(ticker)}`);
        summaryUrl.searchParams.set("modules", "summaryProfile,summaryDetail");
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
        }
        break;
      } catch {
        break; // network error on the enrichment step — base is still valid
      }
    }

    return base;
  }
}
