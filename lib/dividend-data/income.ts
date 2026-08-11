import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";

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

/**
 * Real dividend income bucketed by calendar month, for the trend charts
 * on Dividends and the Passive Income goal — extracted here (rather than
 * left inline, as it originally was on the Dividends page only) so both
 * pages compute it identically instead of two copies drifting apart.
 * Every point is a real recorded payout — no projection, no smoothing.
 */
export async function computeMonthlyIncomeSeries(
  supabase: SupabaseClient,
  holdings: IncomeHolding[],
  months = 12,
): Promise<MonthlyIncomePoint[]> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(d.toISOString().slice(0, 7), 0);
  }

  const toPoints = () =>
    [...buckets.entries()].map(([month, total]) => ({
      month,
      label: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      total,
    }));

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  if (tickers.length === 0) return toPoints();

  const sharesByTicker = new Map<string, number>();
  for (const h of holdings) {
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + Number(h.shares));
  }

  const since = [...buckets.keys()][0] + "-01";
  const { data: events } = await supabase
    .from("dividend_events")
    .select("ticker, pay_date, amount_per_share")
    .in("ticker", tickers)
    .gte("pay_date", since)
    .limit(MAX_EVENT_ROWS);

  for (const event of events ?? []) {
    const bucket = event.pay_date.slice(0, 7);
    if (!buckets.has(bucket)) continue;
    const shares = sharesByTicker.get(event.ticker) ?? 0;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + Number(event.amount_per_share) * shares);
  }

  return toPoints();
}

export type AnnualIncomePoint = {
  year: number;
  total: number;
  /** False for the current calendar year (YTD, not a full year). */
  complete: boolean;
};

/**
 * Calendar-year income at current share counts — same method as TTM,
 * bucketed by year so the growth chart is comparable to the trailing
 * figure rather than a second invented series. Leading empty years are
 * kept so a 5-year axis stays stable; callers decide what to plot.
 */
export async function computeAnnualIncomeSeries(
  supabase: SupabaseClient,
  holdings: IncomeHolding[],
  years = 5,
): Promise<AnnualIncomePoint[]> {
  const currentYear = new Date().getUTCFullYear();
  const startYear = currentYear - (years - 1);
  const points: AnnualIncomePoint[] = [];
  for (let year = startYear; year <= currentYear; year += 1) {
    points.push({ year, total: 0, complete: year < currentYear });
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  if (tickers.length === 0) return points;

  const sharesByTicker = new Map<string, number>();
  for (const h of holdings) {
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + Number(h.shares));
  }

  const { data: events } = await supabase
    .from("dividend_events")
    .select("ticker, pay_date, amount_per_share")
    .in("ticker", tickers)
    .gte("pay_date", `${startYear}-01-01`)
    .limit(MAX_EVENT_ROWS);

  const byYear = new Map(points.map((p) => [p.year, p]));
  for (const event of events ?? []) {
    const year = Number(event.pay_date.slice(0, 4));
    const point = byYear.get(year);
    if (!point) continue;
    point.total += Number(event.amount_per_share) * (sharesByTicker.get(event.ticker) ?? 0);
  }

  return points;
}

const CADENCE_LOOKBACK_DAYS = 400;
const MIN_PAYMENTS_FOR_CADENCE = 2;

export type PayoutMixRow = {
  key: "monthly" | "quarterly" | "annual";
  label: string;
  income: number;
  pct: number;
  color: string;
};

export type CadenceIncome = {
  mix: PayoutMixRow[];
  /** Run-rate from last payout × (365 / cadence); TTM fallback when cadence is unknown. */
  forwardAnnual: number;
  dominantLabel: string | null;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function cadenceBucket(days: number | null, paymentCount: number): PayoutMixRow["key"] {
  if (days != null) {
    if (days <= 45) return "monthly";
    if (days <= 135) return "quarterly";
    return "annual";
  }
  if (paymentCount >= 10) return "monthly";
  if (paymentCount >= 3) return "quarterly";
  return "annual";
}

/**
 * Share of trailing income by payout cadence, plus a next-12-month
 * run-rate from each ticker's last recorded amount and median gap.
 * Not a Yahoo forward yield — those are unreliable for the ETFs this
 * product tracks — and must be labeled as an estimate, not a projection.
 */
export async function computeCadenceIncome(
  supabase: SupabaseClient,
  holdings: IncomeHolding[],
  perTickerTtm: Map<string, number>,
): Promise<CadenceIncome> {
  const MIX: Omit<PayoutMixRow, "income" | "pct">[] = [
    { key: "monthly", label: "Monthly payers", color: "#4c82f7" },
    { key: "quarterly", label: "Quarterly payers", color: "#3fbf87" },
    { key: "annual", label: "Semi-annual / annual", color: "#e0a45c" },
  ];
  const empty = (): CadenceIncome => ({
    mix: MIX.map((row) => ({ ...row, income: 0, pct: 0 })),
    forwardAnnual: 0,
    dominantLabel: null,
  });

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  if (tickers.length === 0) return empty();

  const sharesByTicker = new Map<string, number>();
  for (const h of holdings) {
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + Number(h.shares));
  }

  const since = new Date(Date.now() - CADENCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("dividend_events")
    .select("ticker, pay_date, amount_per_share")
    .in("ticker", tickers)
    .gte("pay_date", since)
    .order("pay_date", { ascending: true })
    .limit(MAX_EVENT_ROWS);

  const byTicker = new Map<string, { pay_date: string; amount_per_share: number }[]>();
  for (const event of events ?? []) {
    const list = byTicker.get(event.ticker) ?? [];
    list.push({ pay_date: event.pay_date, amount_per_share: Number(event.amount_per_share) });
    byTicker.set(event.ticker, list);
  }

  const cadenceDays = new Map<string, number>();
  const lastAmount = new Map<string, number>();
  const paymentCount = new Map<string, number>();
  for (const [ticker, history] of byTicker) {
    paymentCount.set(ticker, history.length);
    lastAmount.set(ticker, history[history.length - 1]!.amount_per_share);
    if (history.length < MIN_PAYMENTS_FOR_CADENCE) continue;
    const gaps: number[] = [];
    for (let i = 1; i < history.length; i += 1) {
      const prev = new Date(`${history[i - 1]!.pay_date}T00:00:00Z`).getTime();
      const curr = new Date(`${history[i]!.pay_date}T00:00:00Z`).getTime();
      gaps.push((curr - prev) / (1000 * 60 * 60 * 24));
    }
    const days = Math.round(median(gaps));
    if (days > 0) cadenceDays.set(ticker, days);
  }

  const incomeByBucket: Record<PayoutMixRow["key"], number> = { monthly: 0, quarterly: 0, annual: 0 };
  let forwardAnnual = 0;

  for (const ticker of tickers) {
    const ttm = perTickerTtm.get(ticker) ?? 0;
    const bucket = cadenceBucket(cadenceDays.get(ticker) ?? null, paymentCount.get(ticker) ?? 0);
    incomeByBucket[bucket] += ttm;

    const days = cadenceDays.get(ticker);
    const last = lastAmount.get(ticker);
    const shares = sharesByTicker.get(ticker) ?? 0;
    if (days != null && last != null && last > 0 && shares > 0) {
      forwardAnnual += last * shares * (365 / days);
    } else {
      forwardAnnual += ttm;
    }
  }

  const ttmTotal = [...perTickerTtm.values()].reduce((sum, n) => sum + n, 0);
  const mix = MIX.map((row) => ({
    ...row,
    income: incomeByBucket[row.key],
    pct: ttmTotal > 0 ? (incomeByBucket[row.key] / ttmTotal) * 100 : 0,
  }));
  const dominant = [...mix].sort((a, b) => b.income - a.income)[0];

  return {
    mix,
    forwardAnnual,
    dominantLabel: dominant && dominant.income > 0 ? dominant.label.toLowerCase() : null,
  };
}
