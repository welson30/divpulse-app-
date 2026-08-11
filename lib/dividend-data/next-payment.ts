import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDividendDataProvider } from "@/lib/dividend-data";

const LOOKBACK_DAYS = 400;
const MAX_EVENT_ROWS = 2000;
const MIN_PAYMENTS_FOR_ESTIMATE = 2;
// Guards the forward-projection loops below against runaway iteration if
// bad/duplicate data ever produced a tiny cadence — 60 cycles covers over
// a year of even the most frequent (weekly) real payers.
const MAX_PROJECTION_ITERATIONS = 60;
// How many of the soonest cadence-based candidates get a live Yahoo
// lookup for a real confirmed date — bounded so this never turns into one
// Yahoo request per held ticker, the exact N+1 problem
// lib/tickers/enrich.ts exists to avoid elsewhere. Checking a few
// candidates (not just the single soonest) matters because Yahoo
// upgrading one ticker's date can push a different ticker back into
// first place.
const CONFIRM_CANDIDATE_COUNT = 3;

export type NextPaymentEstimate = {
  ticker: string;
  payDate: string;
  amountPerShare: number;
  /** "confirmed" when Yahoo has an actual announced date for it, "estimated" when derived from this ticker's own payment cadence. */
  source: "confirmed" | "estimated";
};

export type UpcomingPaymentEstimate = {
  ticker: string;
  payDate: string;
  amountPerShare: number;
  /** Same meaning as NextPaymentEstimate.source. */
  source: "confirmed" | "estimated";
};

type TickerCadence = {
  ticker: string;
  /** Median days between this ticker's last several recorded payments. */
  cadenceDays: number;
  lastPayDate: string;
  lastAmountPerShare: number;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Shared by both estimators below — one pass over a ticker's recorded history to learn its payment frequency. */
function computeCadences(events: { ticker: string; pay_date: string; amount_per_share: number }[]): TickerCadence[] {
  const byTicker = new Map<string, { pay_date: string; amount_per_share: number }[]>();
  for (const event of events) {
    const list = byTicker.get(event.ticker) ?? [];
    list.push({ pay_date: event.pay_date, amount_per_share: Number(event.amount_per_share) });
    byTicker.set(event.ticker, list);
  }

  const cadences: TickerCadence[] = [];
  for (const [ticker, history] of byTicker) {
    // Fewer than two payments means there's no gap to measure a cadence
    // from — one data point can't tell you a frequency.
    if (history.length < MIN_PAYMENTS_FOR_ESTIMATE) continue;

    const gaps: number[] = [];
    for (let i = 1; i < history.length; i += 1) {
      const prev = new Date(`${history[i - 1]!.pay_date}T00:00:00Z`).getTime();
      const curr = new Date(`${history[i]!.pay_date}T00:00:00Z`).getTime();
      gaps.push((curr - prev) / (1000 * 60 * 60 * 24));
    }

    const cadenceDays = Math.round(median(gaps));
    if (cadenceDays <= 0) continue; // guards against duplicate/bad rows producing a zero or negative gap

    const last = history[history.length - 1]!;
    cadences.push({ ticker, cadenceDays, lastPayDate: last.pay_date, lastAmountPerShare: last.amount_per_share });
  }
  return cadences;
}

export function frequencyFromCadenceDays(days: number): string {
  if (days <= 10) return "Weekly";
  if (days <= 45) return "Monthly";
  if (days <= 135) return "Quarterly";
  return "Annual";
}

/** Median payout cadence label per ticker, for calendar chips — same history window as upcoming-payment estimates. */
export async function getTickerFrequencies(
  supabase: SupabaseClient,
  tickers: string[],
): Promise<Map<string, string>> {
  if (tickers.length === 0) return new Map();
  const events = await fetchRecentEvents(supabase, tickers);
  const cadences = computeCadences(events);
  return new Map(cadences.map((c) => [c.ticker, frequencyFromCadenceDays(c.cadenceDays)]));
}

async function fetchRecentEvents(supabase: SupabaseClient, tickers: string[]) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("dividend_events")
    .select("ticker, pay_date, amount_per_share")
    .in("ticker", tickers)
    .gte("pay_date", since)
    .order("pay_date", { ascending: true })
    .limit(MAX_EVENT_ROWS);
  return data ?? [];
}

/**
 * "Next payment" needs a forward-looking date, but Yahoo's unofficial
 * endpoints essentially never have one for dividend_events (confirmed
 * live 2026-08-01: zero of its 428 rows have a future pay_date — the
 * table is built purely from Yahoo's historical dividend data) and its
 * calendarEvents module, which does carry a real forward date, is absent
 * for exactly the ETFs a dividend-focused portfolio leans on (also
 * confirmed live: present for KO/O/MSFT, empty for SCHD/JEPI/QDTE).
 *
 * So this estimates from each ticker's own recorded cadence — the median
 * gap between its last several real dividend_events payments, projected
 * forward past today — as the baseline for every held ticker, then asks
 * Yahoo for a real confirmed date only for the handful of soonest
 * candidates, upgrading to "confirmed" whenever Yahoo actually has one.
 * Explicitly a mix of confirmed and estimated data; callers must label
 * each result according to its own `source`, never present an estimate
 * as a guarantee.
 */
export async function estimateNextPayment(
  supabase: SupabaseClient,
  tickers: string[],
): Promise<NextPaymentEstimate | null> {
  if (tickers.length === 0) return null;

  const events = await fetchRecentEvents(supabase, tickers);
  if (events.length === 0) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const cadences = computeCadences(events);

  const candidates: NextPaymentEstimate[] = cadences.map(({ ticker, cadenceDays, lastPayDate, lastAmountPerShare }) => {
    let expected = new Date(`${lastPayDate}T00:00:00Z`);
    // Project forward past today — the real payment may have already
    // happened but not been detected yet, or the cadence estimate
    // undershoots slightly (e.g. a weekend/holiday nudging real dates).
    let iterations = 0;
    while (expected.toISOString().slice(0, 10) <= todayIso && iterations < MAX_PROJECTION_ITERATIONS) {
      expected = new Date(expected.getTime() + cadenceDays * 24 * 60 * 60 * 1000);
      iterations += 1;
    }
    return { ticker, payDate: expected.toISOString().slice(0, 10), amountPerShare: lastAmountPerShare, source: "estimated" };
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (a.payDate < b.payDate ? -1 : 1));
  const topCandidates = candidates.slice(0, CONFIRM_CANDIDATE_COUNT);

  const provider = getDividendDataProvider();
  const confirmedDates = await Promise.all(
    topCandidates.map((c) => provider.fetchNextDividendDate(c.ticker).catch(() => null)),
  );

  const refined = topCandidates.map((candidate, i) => {
    const confirmed = confirmedDates[i];
    return confirmed ? { ...candidate, payDate: confirmed, source: "confirmed" as const } : candidate;
  });

  refined.sort((a, b) => (a.payDate < b.payDate ? -1 : 1));
  return refined[0]!;
}

/**
 * Every projected payment date within [rangeStartIso, rangeEndIso] for
 * the given tickers — the Calendar page's equivalent of
 * estimateNextPayment, covering a whole visible month rather than just
 * the single soonest payment.
 *
 * Still asks Yahoo for a real confirmed date, but once per distinct
 * ticker with an in-range projection rather than per projected day —
 * bounded by how many tickers are actually held, not by how many times
 * each one is projected to pay this month (a weekly payer can project
 * four occurrences in one view; it still only costs one Yahoo request).
 * Yahoo's calendarEvents only ever exposes a single upcoming date, so
 * only the nearest in-range projection per ticker is eligible to be
 * upgraded — a weekly payer's other three estimated occurrences this
 * month stay estimates, since Yahoo has no way to confirm those.
 */
export async function estimateUpcomingPayments(
  supabase: SupabaseClient,
  tickers: string[],
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<UpcomingPaymentEstimate[]> {
  if (tickers.length === 0) return [];

  const events = await fetchRecentEvents(supabase, tickers);
  if (events.length === 0) return [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const cadences = computeCadences(events);
  const projected: UpcomingPaymentEstimate[] = [];
  const nearestByTicker = new Map<string, string>();

  for (const { ticker, cadenceDays, lastPayDate, lastAmountPerShare } of cadences) {
    let expected = new Date(`${lastPayDate}T00:00:00Z`);
    // Never project onto a day that could still carry a real recorded
    // event — only actual history should ever represent today or earlier.
    const floor = lastPayDate > todayIso ? lastPayDate : todayIso;

    let iterations = 0;
    while (expected.toISOString().slice(0, 10) <= floor && iterations < MAX_PROJECTION_ITERATIONS) {
      expected = new Date(expected.getTime() + cadenceDays * 24 * 60 * 60 * 1000);
      iterations += 1;
    }

    while (expected.toISOString().slice(0, 10) <= rangeEndIso && iterations < MAX_PROJECTION_ITERATIONS) {
      const iso = expected.toISOString().slice(0, 10);
      if (iso >= rangeStartIso) {
        projected.push({ ticker, payDate: iso, amountPerShare: lastAmountPerShare, source: "estimated" });
        if (!nearestByTicker.has(ticker)) nearestByTicker.set(ticker, iso);
      }
      expected = new Date(expected.getTime() + cadenceDays * 24 * 60 * 60 * 1000);
      iterations += 1;
    }
  }

  if (projected.length === 0) return [];

  const provider = getDividendDataProvider();
  const tickersToConfirm = [...nearestByTicker.keys()];
  const confirmedDates = await Promise.all(
    tickersToConfirm.map((ticker) => provider.fetchNextDividendDate(ticker).catch(() => null)),
  );
  const confirmedByTicker = new Map(tickersToConfirm.map((ticker, i) => [ticker, confirmedDates[i]]));

  const results: UpcomingPaymentEstimate[] = [];
  for (const entry of projected) {
    const isNearestOccurrence = nearestByTicker.get(entry.ticker) === entry.payDate;
    const confirmed = isNearestOccurrence ? confirmedByTicker.get(entry.ticker) : null;

    if (!confirmed) {
      results.push(entry);
      continue;
    }
    // Yahoo's date replaces the estimate for this occurrence, even if it
    // lands on a different day than projected — it's the real announced
    // date for the same underlying "next payment" event. If it falls
    // outside the browsed month, drop the occurrence entirely rather
    // than show an estimate already known to be wrong.
    if (confirmed >= rangeStartIso && confirmed <= rangeEndIso) {
      results.push({ ...entry, payDate: confirmed, source: "confirmed" });
    }
  }

  return results;
}
