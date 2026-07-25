import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For You — PaidPrime",
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function greeting() {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("id, ticker, shares, broker_name, company_name")
    .eq("user_id", user!.id);

  const firstName = user?.email?.split("@")[0] ?? "there";
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-sp-4">
        <div>
          <h1 className="text-h1 font-display font-semibold text-text-primary">
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="max-w-sm text-sm text-text-secondary">
            No holdings yet. Add a ticker to start tracking dividend income.
          </p>
          <Button asChild className="h-10">
            <Link href="/holdings">Add first holding</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const provider = getDividendDataProvider();

  const [quotes, { data: todayPayments }, { data: upcomingEvents }] = await Promise.all([
    Promise.all(
      tickers.map(async (ticker) => {
        try {
          return await provider.fetchQuote(ticker);
        } catch {
          return null;
        }
      }),
    ),
    supabase
      .from("dividend_payments")
      .select("id, amount, holding_id")
      .eq("user_id", user!.id)
      .eq("pay_date", todayIso),
    supabase
      .from("dividend_events")
      .select("ticker, pay_date, amount_per_share")
      .in("ticker", tickers)
      .gt("pay_date", todayIso)
      .order("pay_date", { ascending: true })
      .limit(1),
  ]);

  const quoteByTicker = new Map(tickers.map((ticker, i) => [ticker, quotes[i]]));
  const holdingById = new Map(holdings.map((h) => [h.id, h]));

  let portfolioValue = 0;
  let annualIncome = 0;
  for (const holding of holdings) {
    const quote = quoteByTicker.get(holding.ticker);
    const shares = Number(holding.shares);
    const value = quote?.price ? shares * quote.price : 0;
    portfolioValue += value;
    if (quote?.trailingAnnualDividendYield) {
      annualIncome += value * quote.trailingAnnualDividendYield;
    }
  }
  const avgYieldPct = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0;
  const incomePerDay = annualIncome / 365;
  const incomePerMonth = annualIncome / 12;

  const todayTotal = (todayPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const nextEvent = upcomingEvents?.[0];
  const nextHolding = nextEvent ? holdings.find((h) => h.ticker === nextEvent.ticker) : null;
  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(`${nextEvent.pay_date}T00:00:00Z`).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <h1 className="text-h1 font-display font-semibold text-text-primary">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {todayTotal > 0 ? (
            <>
              {" · "}
              <span className="text-green-500">
                {todayPayments!.length} {todayPayments!.length === 1 ? "dividend" : "dividends"} received today
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-sp-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Portfolio value</div>
          <div className="mt-1 font-mono text-2xl font-bold text-text-primary">{formatCurrency(portfolioValue)}</div>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Annual dividend income</div>
          <div className="mt-1 font-mono text-2xl font-bold text-text-primary">{formatCurrency(annualIncome)}</div>
          <div className="mt-1 text-xs text-text-secondary">{avgYieldPct.toFixed(2)}% yield</div>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Today&rsquo;s income</div>
          <div className={`mt-1 font-mono text-2xl font-bold ${todayTotal > 0 ? "text-green-500" : "text-text-primary"}`}>
            {todayTotal > 0 ? `+${formatCurrency(todayTotal)}` : "$0.00"}
          </div>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Income per day</div>
          <div className="mt-1 font-mono text-2xl font-bold text-text-primary">{formatCurrency(incomePerDay)}</div>
          <div className="mt-1 text-xs text-text-secondary">{formatCurrency(incomePerMonth)}/month</div>
        </div>
      </div>

      <div className="grid gap-sp-3 lg:grid-cols-2">
        <div className="flex flex-col gap-sp-2">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 font-display font-medium text-text-primary">Today&rsquo;s payments</h2>
            <Link href="/dividends" className="font-mono text-xs text-green-500 hover:underline">
              See history
            </Link>
          </div>
          {todayPayments && todayPayments.length > 0 ? (
            <div className="overflow-hidden rounded-card border border-border-subtle bg-surface">
              {todayPayments.map((payment, i) => {
                const holding = holdingById.get(payment.holding_id);
                return (
                  <div
                    key={payment.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i === todayPayments.length - 1 ? "" : "border-b border-border-subtle"}`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.1)] font-mono text-[11px] font-bold text-green-500">
                      {holding?.ticker ?? "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-text-primary">+{formatCurrency(Number(payment.amount))}</div>
                      <div className="truncate text-xs text-text-secondary">
                        {holding?.company_name ?? holding?.ticker} · {holding?.broker_name ?? "Unspecified"}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-green-500/30 bg-[rgba(34,197,94,0.1)] px-2 py-0.5 font-mono text-[10px] font-bold text-green-500">
                      Confirmed ✓
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
              No dividends detected yet today.
            </div>
          )}

          <h2 className="mt-sp-2 text-h2 font-display font-medium text-text-primary">Next payment</h2>
          {nextEvent && nextHolding ? (
            <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.1)] font-mono text-[11px] font-bold text-warning">
                  {nextEvent.ticker}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-warning">
                    {formatCurrency(Number(nextEvent.amount_per_share) * Number(nextHolding.shares))} expected
                  </div>
                  <div className="truncate text-xs text-text-secondary">
                    {nextHolding.company_name ?? nextEvent.ticker} · {nextHolding.broker_name ?? "Unspecified"}
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-warning/30 bg-[rgba(251,191,36,0.1)] px-2 py-0.5 font-mono text-[10px] font-bold text-warning">
                  {daysUntilNext === 0 ? "Today" : daysUntilNext === 1 ? "Tomorrow" : `In ${daysUntilNext} days`}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
              No upcoming payments detected yet for your holdings.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-sp-2">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 font-display font-medium text-text-primary">Recent holdings</h2>
            <Link href="/holdings" className="font-mono text-xs text-green-500 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {holdings.slice(0, 6).map((holding) => {
              const quote = quoteByTicker.get(holding.ticker);
              const value = quote?.price ? Number(holding.shares) * quote.price : null;
              return (
                <div key={holding.id} className="rounded-card border border-border-subtle bg-surface p-sp-3">
                  <div className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</div>
                  <div className="mt-1 font-mono text-xs text-text-secondary">
                    {holding.shares} shares{value != null ? ` · ${formatCurrency(value)}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
