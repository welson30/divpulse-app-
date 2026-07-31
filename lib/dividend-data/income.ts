import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Trailing-twelve-month window. Matches the range fetchDividends pulls
 * from Yahoo (lib/dividend-data/yahoo-finance.ts also asks for 365 days),
 * so the numbers here can never claim more history than we actually hold.
 */
export const TTM_WINDOW_DAYS = 365;

/**
 * PostgREST caps an unqualified select, and a silently truncated result
 * would under-report income rather than fail loudly — the exact class of
 * bug this module exists to remove. Sized well past any realistic
 * portfolio: a holder of 90 weekly-paying ETFs would still fit.
 */
const MAX_EVENT_ROWS = 5000;

export type IncomeHolding = { ticker: string; shares: number | string };

export type PortfolioIncome = {
  annual: number;
  monthly: number;
  daily: number;
  /** Income contributed by each ticker, for per-row breakdowns. */
  perTicker: Map<string, number>;
  /**
   * Held tickers with no dividend history in the window. Either genuine
   * non-payers (PLUG) or symbols Yahoo can't resolve (delisted tickers,
   * expired option contracts) — worth surfacing rather than silently
   * counting as zero income.
   */
  tickersWithoutHistory: string[];
};

const EMPTY: PortfolioIncome = {
  annual: 0,
  monthly: 0,
  daily: 0,
  perTicker: new Map(),
  tickersWithoutHistory: [],
};

/**
 * Portfolio dividend income over the trailing twelve months, computed
 * from the dividend_events history we've actually recorded:
 * `shares × Σ(amount_per_share)` per ticker.
 *
 * Deliberately NOT derived from Yahoo's `trailingAnnualDividendYield`,
 * which the dashboard used previously. That field is unreliable for the
 * ETFs this product exists to track — measured 2026-07-31 against a real
 * portfolio, Yahoo returned exactly 0.00% for 13 of 15 held tickers,
 * including mainstream funds like SCHD and JEPI, not just exotic ones.
 * The result was a dashboard reporting $8.66/yr for a portfolio that had
 * actually paid $123.20 — a 14x understatement, and the single loudest
 * complaint in the 2026-07-31 client review (see
 * docs/client-feedback-2026-07-31.md §2).
 *
 * Trailing-twelve-month is the industry-standard framing and is stable
 * month to month, including for quarterly payers. It is backward-looking
 * by construction: for a fund whose distributions are trending down it
 * will read higher than the current run rate, so present it as "trailing
 * 12 months" rather than as a forward projection.
 */
export async function computeTrailingIncome(
  supabase: SupabaseClient,
  holdings: IncomeHolding[],
): Promise<PortfolioIncome> {
  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  if (tickers.length === 0) return EMPTY;

  const since = new Date(Date.now() - TTM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: events, error } = await supabase
    .from("dividend_events")
    .select("ticker, amount_per_share")
    .in("ticker", tickers)
    .gte("pay_date", since)
    .limit(MAX_EVENT_ROWS);

  if (error || !events) return EMPTY;

  // Per-share payout total for each ticker over the window.
  const perShare = new Map<string, number>();
  for (const event of events) {
    perShare.set(event.ticker, (perShare.get(event.ticker) ?? 0) + Number(event.amount_per_share));
  }

  // Applied per holding, not per ticker — the same ticker can be held
  // more than once (different brokers), and each row carries its own
  // share count.
  const perTicker = new Map<string, number>();
  let annual = 0;
  for (const holding of holdings) {
    const income = (perShare.get(holding.ticker) ?? 0) * Number(holding.shares);
    annual += income;
    perTicker.set(holding.ticker, (perTicker.get(holding.ticker) ?? 0) + income);
  }

  return {
    annual,
    monthly: annual / 12,
    daily: annual / TTM_WINDOW_DAYS,
    perTicker,
    tickersWithoutHistory: tickers.filter((t) => !perShare.has(t)),
  };
}
