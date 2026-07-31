"use server";

import "server-only";

export type TickerSearchResult = {
  ticker: string;
  name: string;
  exchange: string | null;
  quoteType: string | null;
};

const SEARCH_ENDPOINT = "https://query1.finance.yahoo.com/v1/finance/search";
const USER_AGENT = "Mozilla/5.0 (compatible; PaidPrimeBot/1.0)";

type YahooSearchResponse = {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    quoteType?: string;
    typeDisp?: string;
  }>;
};

// Yahoo's search also returns options contracts, futures and currency
// pairs — "QDTE Dec 2026 19.000 put" is a real result for "QDTE". None of
// those are addable holdings, so only the three types this app actually
// supports get through.
const ADDABLE_TYPES = new Set(["EQUITY", "ETF", "MUTUALFUND"]);

/**
 * Ticker/company autocomplete — resolves the client's "typing KO should
 * suggest Coca-Cola" complaint. Uses Yahoo's search endpoint, which needs
 * no API key and is already the data source for the rest of the app, so
 * this adds no new vendor or rate limit to manage.
 *
 * A server action rather than a route handler so client components can
 * call it directly without hand-rolling a fetch + JSON parse.
 */
export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  try {
    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("quotesCount", "8");
    url.searchParams.set("newsCount", "0");

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      // Short cache: a search box firing on every keystroke shouldn't hit
      // Yahoo fresh each time, but results also shouldn't go stale for
      // long — a minute balances both.
      next: { revalidate: 60 },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as YahooSearchResponse;

    return (data.quotes ?? [])
      .filter((q) => q.symbol && q.quoteType && ADDABLE_TYPES.has(q.quoteType))
      .slice(0, 6)
      .map((q) => ({
        ticker: q.symbol!.toUpperCase(),
        name: q.longname ?? q.shortname ?? q.symbol!,
        exchange: q.exchDisp ?? null,
        quoteType: q.quoteType ?? null,
      }));
  } catch {
    return []; // a failed search degrades to manual entry, never blocks the form
  }
}
