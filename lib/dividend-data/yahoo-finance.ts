import "server-only";
import type { DividendDataProvider, DividendEvent } from "./types";

// Unofficial endpoint — no API key, no published SLA, no documented rate
// limits. This is the sole reason the DividendDataProvider interface
// exists: if Yahoo changes or throttles this endpoint, only this file
// needs to change. See ARCHITECTURE.md §12.
const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";

type YahooChartResponse = {
  chart: {
    result: [
      {
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
}
