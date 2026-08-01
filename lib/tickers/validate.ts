/**
 * Matches the ticker-detail route's own validation
 * (app/(dashboard)/tickers/[ticker]/page.tsx) — the single source of
 * truth for "is this a symbol shape the route will actually render."
 * Real-world tickers are short (max seen: 5-6 letters); OCC-format
 * options symbols (e.g. "NFLX180201C00355000") run 15-21 characters and
 * only ever show up via Plaid-synced brokerage data, never manual entry
 * (the add-holding form already caps input at 10 chars) or ticker search
 * (Yahoo's search only returns EQUITY/ETF/MUTUALFUND). Any UI that links
 * a holding's own ticker to its detail page needs this check first, or a
 * Plaid-synced options/futures position turns into a dead 404 link.
 */
const TICKER_LINK_PATTERN = /^[A-Z0-9.\-]{1,10}$/;

export function isLinkableTicker(ticker: string): boolean {
  return TICKER_LINK_PATTERN.test(ticker.trim().toUpperCase());
}
