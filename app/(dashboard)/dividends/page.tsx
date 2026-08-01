import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Calendar, ChevronRight, CircleDollarSign, Coins, Sprout, Target, TrendingUp, Trophy, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { StatCard } from "@/components/dashboard/market-stats";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import { MonthlyIncomeChart, type MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export const metadata: Metadata = {
  title: "Dividends — PaidPrime",
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const HISTORY_HEAD =
  "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";

export default async function DividendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase.from("holdings").select("id, ticker, shares").eq("user_id", user!.id);

  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];

  const [{ data: payments }, { data: events }] = await Promise.all([
    supabase
      .from("dividend_payments")
      .select("id, amount, pay_date, holding_id")
      .eq("user_id", user!.id)
      .order("pay_date", { ascending: false }),
    tickers.length > 0
      ? supabase
          .from("dividend_events")
          .select("id, ticker, ex_date, pay_date, amount_per_share")
          .in("ticker", tickers)
          .order("pay_date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const holdingById = new Map((holdings ?? []).map((h) => [h.id, h]));
  const enriched = await enrichTickers(tickers);
  const logoFor = (ticker: string | undefined) =>
    ticker ? (enriched.get(ticker.toUpperCase())?.logoUrl ?? null) : null;

  // The event list on its own is 400-odd rows of raw history; these turn
  // it into the numbers the page is actually for — what this portfolio
  // earns per year, month and day.
  const income = await computeTrailingIncome(supabase, holdings ?? []);
  const sharesByTicker = new Map<string, number>();
  for (const h of holdings ?? []) {
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + Number(h.shares));
  }

  // Last 12 months of income, bucketed by calendar month.
  const monthly = new Map<string, number>();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthly.set(d.toISOString().slice(0, 7), 0);
  }
  for (const event of events ?? []) {
    const bucket = event.pay_date.slice(0, 7);
    if (!monthly.has(bucket)) continue;
    const shares = sharesByTicker.get(event.ticker) ?? 0;
    monthly.set(bucket, (monthly.get(bucket) ?? 0) + Number(event.amount_per_share) * shares);
  }
  const monthlyEntries = [...monthly.entries()];
  const monthlySeries: MonthlyIncomePoint[] = monthlyEntries.map(([month, total]) => ({
    month,
    label: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    total,
  }));
  // Same 12 real monthly totals, reshaped for the stat-card mini sparklines
  // — not a separate fabricated series.
  const monthlySparkline: SparklinePoint[] = monthlyEntries.map(([month, total]) => ({
    t: Math.floor(new Date(`${month}-01T00:00:00Z`).getTime() / 1000),
    c: total,
  }));

  // Real, derived growth signal: first half of the trailing-12mo window
  // vs. the second half. Not "vs last month" (too noisy for weekly/monthly
  // payers with irregular cadence) — a wider window is stable enough to
  // say something honest. Hidden if there's too little history to be
  // meaningful rather than shown with a misleading swing.
  const firstHalfTotal = monthlyEntries.slice(0, 6).reduce((sum, [, total]) => sum + total, 0);
  const secondHalfTotal = monthlyEntries.slice(6).reduce((sum, [, total]) => sum + total, 0);
  const growthPct = firstHalfTotal > 0 ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 : null;

  // Which holdings actually generate the income.
  // The raw event list runs to several hundred rows for a portfolio of
  // weekly payers — a wall of numbers nobody scrolls. Show the most
  // recent slice and say how many there are in total.
  const HISTORY_LIMIT = 60;
  const recentEvents = (events ?? []).slice(0, HISTORY_LIMIT);
  const totalEvents = (events ?? []).length;

  // dividend_events holds Yahoo's full trailing history — often a year
  // or more back, well before a holding was added or before the
  // detection cron itself was fixed (it silently caught nothing until
  // 2026-07-31 — see docs/client-feedback-2026-07-31.md §3). A row here
  // having no matching dividend_payments confirmation just means this
  // app wasn't around to notify about it in real time, not that the
  // payment hasn't happened — confirmed live: 395 of 401 real historical
  // events for a typical portfolio have no confirmation row. So "Paid"
  // vs "Pending" is a calendar fact (has pay_date already passed?), not
  // whether our own notification pipeline happened to catch it — a
  // confirmed row is still preferred for the exact payout amount when
  // one exists, since it reflects what was actually detected rather than
  // a recomputed estimate.
  const paymentByTickerDate = new Map<string, { id: string; amount: number }>();
  for (const p of payments ?? []) {
    const ticker = holdingById.get(p.holding_id)?.ticker;
    if (ticker) paymentByTickerDate.set(`${ticker}|${p.pay_date}`, { id: p.id, amount: Number(p.amount) });
  }

  const topEarners = [...income.perTicker.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (tickers.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Dividends</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to start tracking dividend income.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-col gap-sp-3 lg:flex-row lg:items-stretch">
        <div className="relative flex flex-1 items-start gap-sp-2">
          <GreetingBackdrop />
          <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(34,197,94,0.12)] text-green-500">
            <Sprout className="size-6" />
          </span>
          <div className="relative z-10 min-w-0">
            <h1 className="text-h1 font-display font-semibold text-text-primary">Dividends</h1>
            <p className="text-sm text-text-secondary">Steady income. Long-term wealth.</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar className="size-3.5" aria-hidden />
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <Link
          href="/goals"
          className="flex items-center gap-3 rounded-card border border-green-500/20 bg-[rgba(34,197,94,0.06)] p-sp-3 transition-colors hover:bg-[rgba(34,197,94,0.1)] lg:w-75"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)] text-green-500">
            <Target className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-text-primary">Build passive income</div>
            <div className="text-xs text-text-secondary">Set a target, track your progress</div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-sp-2">
        <StatCard
          label="Portfolio annual income"
          value={formatMoney(income.annual)}
          tip={TIPS.annualIncome}
          icon={Coins}
          sparkline={monthlySparkline}
          compact
        />
        <StatCard
          label="Monthly income"
          value={formatMoney(income.monthly)}
          sub="12-month average"
          icon={Wallet}
          sparkline={monthlySparkline}
          compact
        />
        <StatCard
          label="Daily income"
          value={formatMoney(income.daily)}
          tip={TIPS.incomePerDay}
          icon={CircleDollarSign}
          sparkline={monthlySparkline}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-sp-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 flex flex-col gap-sp-2 rounded-card border border-border-subtle bg-surface p-sp-4">
          <div className="flex flex-wrap items-center justify-between gap-x-sp-2 gap-y-1.5">
            <h2 className="flex items-center gap-1.5 text-h2 font-display font-medium text-text-primary">
              <BarChart3 className="size-4.5 text-text-secondary" aria-hidden />
              Income by month
            </h2>
            <span className="shrink-0 rounded-full border border-border-subtle px-2.5 py-1 font-mono text-[11px] text-text-secondary">
              Last 12 months
            </span>
          </div>
          <p className="-mt-1 text-xs text-text-secondary">Dividends paid over the last 12 months, at your current share counts.</p>
          <MonthlyIncomeChart data={monthlySeries} />
          {growthPct != null ? (
            <div className="mt-1 flex items-center gap-2 rounded-card border border-green-500/20 bg-[rgba(34,197,94,0.06)] px-sp-3 py-2.5">
              <TrendingUp className="size-4 shrink-0 text-green-500" aria-hidden />
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {growthPct >= 0 ? "Consistent growth" : "Income has slowed"} in dividend income
                </span>
                {" — "}
                {growthPct >= 0 ? "+" : ""}
                {growthPct.toFixed(0)}% {growthPct >= 0 ? "growth" : "change"} vs. the first half of the last 12 months
              </p>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex flex-col gap-sp-2 rounded-card border border-border-subtle bg-surface p-sp-4">
          <div className="flex items-center justify-between gap-sp-2">
            <h2 className="flex items-center gap-1.5 text-h2 font-display font-medium text-text-primary">
              <Trophy className="size-4.5 text-text-secondary" aria-hidden />
              Top earners
            </h2>
          </div>
          <p className="-mt-1 text-xs text-text-secondary">Which holdings pay you the most.</p>
          {topEarners.length === 0 ? (
            <p className="text-sm text-text-secondary">No dividend history yet for your holdings.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${HISTORY_HEAD} text-left`}>Company</th>
                    <th className={`${HISTORY_HEAD} text-right`}>
                      <span className="inline-flex items-center gap-1">Yield <InfoTip label={TIPS.dividendYield} /></span>
                    </th>
                    <th className={`${HISTORY_HEAD} text-right`}>Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.map(([ticker, amount], i) => {
                    const yieldPct = enriched.get(ticker.toUpperCase())?.quote?.dividendYieldPercent ?? null;
                    return (
                      <tr key={ticker} className={i === topEarners.length - 1 ? "" : "border-b border-border-subtle"}>
                        <td className="px-sp-3 py-2.5">
                          {isLinkableTicker(ticker) ? (
                            <Link href={`/tickers/${ticker}`} className="flex items-center gap-2">
                              <TickerLogo ticker={ticker} logoUrl={logoFor(ticker)} size="sm" />
                              <span className="font-mono text-[13px] font-semibold text-text-primary">{ticker}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TickerLogo ticker={ticker} logoUrl={logoFor(ticker)} size="sm" />
                              <span className="font-mono text-[13px] font-semibold text-text-primary">{ticker}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-sp-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-text-secondary">
                          {yieldPct != null ? `${yieldPct.toFixed(2)}%` : "—"}
                        </td>
                        <td className="px-sp-3 py-2.5 text-right font-mono text-[13px] font-semibold tabular-nums text-green-500">
                          {formatMoney(amount / 12)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-sp-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-h2 font-display font-medium text-text-primary">
            <Calendar className="size-4.5 text-text-secondary" aria-hidden />
            Recent dividend payments
          </h2>
        </div>
        <p className="-mt-1 text-xs text-text-secondary">
          {totalEvents > HISTORY_LIMIT
            ? `Most recent ${HISTORY_LIMIT} of ${totalEvents} payouts for your tracked tickers.`
            : "Past payouts for your tracked tickers."}
        </p>
        {recentEvents.length === 0 ? (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
            No dividend history found yet for your tracked tickers.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
            <table className="w-full min-w-160 border-collapse">
              <thead>
                <tr>
                  <th className={`${HISTORY_HEAD} text-left`}>Company</th>
                  <th className={`${HISTORY_HEAD} text-right`}>Amount</th>
                  <th className={`${HISTORY_HEAD} text-left`}>
                    <span className="inline-flex items-center gap-1">Ex-date <InfoTip label={TIPS.exDate} /></span>
                  </th>
                  <th className={`${HISTORY_HEAD} text-left`}>Payment date</th>
                  <th className={`${HISTORY_HEAD} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, i) => {
                  const shares = sharesByTicker.get(event.ticker) ?? 0;
                  const matched = paymentByTickerDate.get(`${event.ticker}|${event.pay_date}`);
                  // Status reflects the calendar, not our own notification
                  // bookkeeping — see the comment on paymentByTickerDate
                  // above. A confirmed row is still preferred for the
                  // exact amount when one exists.
                  const isPaid = event.pay_date <= todayIso;
                  const payout = matched ? matched.amount : shares * Number(event.amount_per_share);
                  return (
                    <tr
                      key={event.id}
                      className={`transition-colors hover:bg-surface-hover ${i === recentEvents.length - 1 ? "" : "border-b border-border-subtle"}`}
                    >
                      <td className="px-sp-3 py-3">
                        {isLinkableTicker(event.ticker) ? (
                          <Link href={`/tickers/${event.ticker}`} className="flex items-center gap-2.5">
                            <TickerLogo ticker={event.ticker} logoUrl={logoFor(event.ticker)} size="sm" />
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-semibold text-text-primary">{event.ticker}</div>
                              <div className="mt-0.5 max-w-50 truncate text-xs text-text-secondary">
                                {enriched.get(event.ticker.toUpperCase())?.name ?? ""}
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <TickerLogo ticker={event.ticker} logoUrl={logoFor(event.ticker)} size="sm" />
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-semibold text-text-primary">{event.ticker}</div>
                              <div className="mt-0.5 max-w-50 truncate text-xs text-text-secondary">
                                {enriched.get(event.ticker.toUpperCase())?.name ?? ""}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-sp-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-green-500">
                        {payout > 0 ? `+${formatMoney(payout)}` : "—"}
                      </td>
                      <td className="px-sp-3 py-3 text-[13px] text-text-secondary">
                        {event.ex_date ? formatDate(event.ex_date) : "—"}
                      </td>
                      <td className="px-sp-3 py-3 text-[13px] text-text-secondary">{formatDate(event.pay_date)}</td>
                      <td className="px-sp-3 py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                            isPaid
                              ? "border-green-500/30 bg-[rgba(34,197,94,0.1)] text-green-500"
                              : "border-warning/30 bg-[rgba(251,191,36,0.1)] text-warning"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
