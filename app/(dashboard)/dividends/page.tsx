import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { StatCard } from "@/components/dashboard/market-stats";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import { MonthlyIncomeChart, type MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";

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
  const totalConfirmed = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

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
  const monthlySeries: MonthlyIncomePoint[] = [...monthly.entries()].map(([month, total]) => ({
    month,
    label: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    total,
  }));

  // Which holdings actually generate the income.
  // The raw event list runs to several hundred rows for a portfolio of
  // weekly payers — a wall of numbers nobody scrolls. Show the most
  // recent slice and say how many there are in total.
  const HISTORY_LIMIT = 60;
  const recentEvents = (events ?? []).slice(0, HISTORY_LIMIT);
  const totalEvents = (events ?? []).length;

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
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Dividends</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {(payments ?? []).length === 0
            ? "No confirmed payments yet — detected payouts will appear here the day they land."
            : `$${totalConfirmed.toFixed(2)} confirmed across ${payments!.length} ${payments!.length === 1 ? "payment" : "payments"}`}
        </p>
      </div>

      <div className="grid gap-sp-2 sm:grid-cols-3">
        <StatCard label="Per year" value={`$${income.annual.toFixed(2)}`} tip={TIPS.annualIncome} />
        <StatCard label="Per month" value={`$${income.monthly.toFixed(2)}`} sub="12-month average" />
        <StatCard label="Per day" value={`$${income.daily.toFixed(2)}`} tip={TIPS.incomePerDay} />
      </div>

      <div className="grid gap-sp-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-1 text-h2 font-display font-medium text-text-primary">Income by month</h2>
          <p className="mb-sp-3 text-xs text-text-secondary">
            Dividends paid over the last 12 months, at your current share counts.
          </p>
          <MonthlyIncomeChart data={monthlySeries} />
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-1 text-h2 font-display font-medium text-text-primary">Top earners</h2>
          <p className="mb-sp-3 text-xs text-text-secondary">Which holdings pay you the most.</p>
          {topEarners.length === 0 ? (
            <p className="text-sm text-text-secondary">No dividend history yet for your holdings.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topEarners.map(([ticker, amount]) => {
                const share = income.annual > 0 ? (amount / income.annual) * 100 : 0;
                return (
                  <div key={ticker} className="flex items-center gap-2.5">
                    <TickerLogo ticker={ticker} logoUrl={logoFor(ticker)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[13px] font-semibold text-text-primary">{ticker}</span>
                        <span className="font-mono text-[13px] font-semibold tabular-nums text-green-500">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-hover">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Confirmed payments</h2>
        {(payments ?? []).length === 0 ? (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
            Nothing detected yet. The daily check runs automatically — this fills in the moment a tracked holding pays.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Ticker
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Pay date
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments!.map((payment, i) => (
                  <tr key={payment.id} className={i === payments!.length - 1 ? "" : "border-b border-border-subtle"}>
                    <td className="px-sp-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <TickerLogo
                          ticker={holdingById.get(payment.holding_id)?.ticker ?? "—"}
                          logoUrl={logoFor(holdingById.get(payment.holding_id)?.ticker)}
                          size="sm"
                        />
                        <span className="font-mono text-sm font-semibold text-text-primary">
                          {holdingById.get(payment.holding_id)?.ticker ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{formatDate(payment.pay_date)}</td>
                    <td className="px-sp-3 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-green-500">
                      +${Number(payment.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Dividend history</h2>
        <p className="-mt-1 text-xs text-text-secondary">
          {totalEvents > HISTORY_LIMIT
            ? `Most recent ${HISTORY_LIMIT} of ${totalEvents} payouts for your tracked tickers.`
            : "Past payouts for your tracked tickers."}
        </p>
        {(events ?? []).length === 0 ? (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
            No dividend history found yet for your tracked tickers.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  <th className={`${HISTORY_HEAD} text-left`}>Asset</th>
                  <th className={`${HISTORY_HEAD} text-left`}>
                    <span className="inline-flex items-center gap-1">Ex-date <InfoTip label={TIPS.exDate} /></span>
                  </th>
                  <th className={`${HISTORY_HEAD} text-right`}>
                    <span className="inline-flex items-center gap-1">Per share <InfoTip label={TIPS.perShare} /></span>
                  </th>
                  <th className={`${HISTORY_HEAD} text-right`}>Your shares</th>
                  <th className={`${HISTORY_HEAD} text-right`}>Your payout</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, i) => {
                  const shares = sharesByTicker.get(event.ticker) ?? 0;
                  const payout = Number(event.amount_per_share) * shares;
                  return (
                    <tr
                      key={event.id}
                      className={`transition-colors hover:bg-surface-hover ${i === recentEvents.length - 1 ? "" : "border-b border-border-subtle"}`}
                    >
                      <td className="px-sp-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <TickerLogo ticker={event.ticker} logoUrl={logoFor(event.ticker)} size="sm" />
                          <div className="min-w-0">
                            <div className="font-mono text-sm font-semibold text-text-primary">{event.ticker}</div>
                            <div className="mt-0.5 max-w-[200px] truncate text-xs text-text-secondary">
                              {enriched.get(event.ticker.toUpperCase())?.name ?? ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-sp-3 py-3 text-[13px] text-text-secondary">
                        {event.ex_date ? formatDate(event.ex_date) : "—"}
                      </td>
                      <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-secondary">
                        ${Number(event.amount_per_share).toFixed(4)}
                      </td>
                      <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-secondary">
                        {shares || "—"}
                      </td>
                      <td className="px-sp-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-green-500">
                        {payout > 0 ? `+$${payout.toFixed(2)}` : "—"}
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
