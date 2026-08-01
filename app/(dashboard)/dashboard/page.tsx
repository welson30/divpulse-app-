import type { Metadata } from "next";
import Link from "next/link";
import { Aperture, Calendar, ChevronRight, Clock, DollarSign, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { enrichTickers } from "@/lib/tickers/enrich";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { Sparkline, ChangeBadge } from "@/components/dashboard/sparkline";
import { MarketStateBadge, StatCard } from "@/components/dashboard/market-stats";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { TIPS } from "@/lib/tips";
import { Button } from "@/components/ui/button";
import type { EnrichedTicker } from "@/lib/tickers/enrich";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export const metadata: Metadata = {
  title: "For You — PaidPrime",
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Index-aligned, shares-weighted sum of each holding's own real
 * sparkline series — a genuine derived portfolio trend (same idea as
 * summing portfolioValue itself), not a fabricated curve. Index-aligned
 * rather than timestamp-matched because every holding's sparkline comes
 * from the same batched Yahoo request (enrichTickers) at the same
 * range/interval, so series line up point-for-point even when exact
 * timestamps differ by a few seconds.
 */
function buildPortfolioSparkline(
  holdings: { ticker: string; shares: number | string }[],
  infoFor: (ticker: string) => EnrichedTicker | undefined,
): SparklinePoint[] {
  const series = holdings
    .map((h) => ({ shares: Number(h.shares), points: infoFor(h.ticker)?.sparkline ?? [] }))
    .filter((s) => s.points.length > 1);

  if (series.length === 0) return [];

  const longest = series.reduce((a, b) => (b.points.length > a.points.length ? b : a)).points;

  const aggregate: SparklinePoint[] = [];
  for (let i = 0; i < longest.length; i += 1) {
    let total = 0;
    let any = false;
    for (const s of series) {
      const point = s.points[i];
      if (point) {
        total += s.shares * point.c;
        any = true;
      }
    }
    if (any) aggregate.push({ t: longest[i]!.t, c: total });
  }
  return aggregate;
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

  const [{ data: holdings }, { data: profile }] = await Promise.all([
    supabase.from("holdings").select("id, ticker, shares, broker_name, company_name").eq("user_id", user!.id),
    supabase.from("profiles").select("display_name").eq("id", user!.id).single(),
  ]);

  // Prefer the name the user actually set; only fall back to guessing one
  // from their email when they haven't (display_name is a free-text field
  // set in Settings — "Shuja Uddin" greets as "Shuja", the first word).
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "there";
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

  const [enriched, { data: todayPayments }, { data: upcomingEvents }, income] = await Promise.all([
    enrichTickers(tickers),
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
    computeTrailingIncome(supabase, holdings),
  ]);

  const holdingById = new Map(holdings.map((h) => [h.id, h]));
  const infoFor = (ticker: string) => enriched.get(ticker.toUpperCase());

  // Quotes still supply price (that part of Yahoo's data is reliable), but
  // income comes from recorded dividend history via computeTrailingIncome
  // — see lib/dividend-data/income.ts for why the yield field can't be
  // trusted for the ETFs this product tracks.
  // Day change is the only "profit/loss" this app can honestly compute:
  // holdings carry no purchase price, so there is no cost basis to
  // measure a real gain against. Today's move is real, and it's what
  // brokerage apps lead with anyway.
  let portfolioValue = 0;
  let portfolioPrevValue = 0;
  for (const holding of holdings) {
    const quote = infoFor(holding.ticker)?.quote;
    const shares = Number(holding.shares);
    if (quote?.price) portfolioValue += shares * quote.price;
    if (quote?.previousClose) portfolioPrevValue += shares * quote.previousClose;
  }
  const portfolioDayChange = portfolioPrevValue > 0 ? portfolioValue - portfolioPrevValue : null;
  const portfolioDayChangePct =
    portfolioPrevValue > 0 ? ((portfolioValue - portfolioPrevValue) / portfolioPrevValue) * 100 : null;

  const marketQuote = [...enriched.values()].find((e) => e.quote?.marketState)?.quote ?? null;
  const portfolioSparkline = buildPortfolioSparkline(holdings, infoFor);

  const annualIncome = income.annual;
  const incomePerDay = income.daily;
  const incomePerMonth = income.monthly;
  const avgYieldPct = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0;

  const todayTotal = (todayPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const nextEvent = upcomingEvents?.[0];
  const nextHolding = nextEvent ? holdings.find((h) => h.ticker === nextEvent.ticker) : null;
  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(`${nextEvent.pay_date}T00:00:00Z`).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10">
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
          <MarketStateBadge
            marketState={marketQuote?.marketState}
            delayMinutes={marketQuote?.exchangeDelayMinutes}
            className="mt-1.5"
          />
        </div>
      </div>

      {/*
        Portfolio value is the hero stat on mobile — full width, with its
        own sparkline — while the other three collapse into a compact
        3-across row beneath it. `lg:contents` dissolves that wrapping div
        at desktop width so all four become plain siblings of the outer
        4-column grid, recreating the uniform row the desktop design uses,
        without maintaining two separate layouts.
      */}
      <div className="grid grid-cols-1 gap-sp-2 lg:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={formatCurrency(portfolioValue)}
          changeAmount={portfolioDayChange}
          changePercent={portfolioDayChangePct}
          tip={TIPS.portfolioValue}
          icon={TrendingUp}
          sparkline={portfolioSparkline}
        />
        <div className="grid grid-cols-3 gap-sp-2 lg:contents">
          <StatCard
            label="Annual dividend income"
            value={formatCurrency(annualIncome)}
            sub={`${avgYieldPct.toFixed(2)}% yield · trailing 12mo`}
            tip={TIPS.annualIncome}
            icon={DollarSign}
            compact
          />
          <StatCard
            label="Monthly dividend income"
            value={formatCurrency(incomePerMonth)}
            sub="trailing 12mo ÷ 12"
            tip={TIPS.monthlyIncome}
            icon={Calendar}
            compact
          />
          <StatCard
            label="Income per day"
            value={formatCurrency(incomePerDay)}
            sub="trailing 12mo ÷ 365"
            tip={TIPS.incomePerDay}
            icon={Aperture}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-sp-3 lg:grid-cols-2">
        <div className="min-w-0 flex flex-col gap-sp-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-h2 font-display font-medium text-text-primary">
              <Calendar className="size-4.5 text-text-secondary" aria-hidden />
              Today&rsquo;s payments
            </h2>
            <Link href="/dividends" className="font-mono text-xs text-green-500 hover:underline">
              See history
            </Link>
          </div>
          {todayPayments && todayPayments.length > 0 ? (
            <div className="overflow-hidden rounded-card border border-border-subtle bg-surface">
              {todayPayments.map((payment, i) => {
                const holding = holdingById.get(payment.holding_id);
                const rowClassName = `flex items-center gap-3 px-4 py-3.5 ${i === todayPayments.length - 1 ? "" : "border-b border-border-subtle"}`;
                const content = (
                  <>
                    <TickerLogo
                      ticker={holding?.ticker ?? "—"}
                      logoUrl={holding ? infoFor(holding.ticker)?.logoUrl : null}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-text-primary">+{formatCurrency(Number(payment.amount))}</div>
                      <div className="truncate text-xs text-text-secondary">
                        {holding?.company_name ?? holding?.ticker} · {holding?.broker_name ?? "Unspecified"}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-green-500/30 bg-[rgba(34,197,94,0.1)] px-2 py-0.5 font-mono text-[10px] font-bold text-green-500">
                      Confirmed ✓
                    </span>
                  </>
                );
                return holding && isLinkableTicker(holding.ticker) ? (
                  <Link
                    key={payment.id}
                    href={`/tickers/${holding.ticker}`}
                    className={`${rowClassName} transition-colors hover:bg-surface-hover`}
                  >
                    {content}
                    <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                  </Link>
                ) : (
                  <div key={payment.id} className={rowClassName}>
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-center text-sm text-text-secondary">
              <Calendar className="size-6 text-text-tertiary" aria-hidden />
              No dividends detected yet today.
            </div>
          )}

          <h2 className="mt-sp-2 flex items-center gap-1.5 text-h2 font-display font-medium text-text-primary">
            <Clock className="size-4.5 text-text-secondary" aria-hidden />
            Next payment
          </h2>
          {nextEvent && nextHolding ? (
            isLinkableTicker(nextEvent.ticker) ? (
              <Link
                href={`/tickers/${nextEvent.ticker}`}
                className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface p-sp-3 transition-colors hover:bg-surface-hover"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TickerLogo ticker={nextEvent.ticker} logoUrl={infoFor(nextEvent.ticker)?.logoUrl} />
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
                <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface p-sp-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TickerLogo ticker={nextEvent.ticker} logoUrl={infoFor(nextEvent.ticker)?.logoUrl} />
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
            )
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-center text-sm text-text-secondary">
              <Clock className="size-6 text-text-tertiary" aria-hidden />
              No upcoming payments detected yet for your holdings.
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col gap-sp-2">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 font-display font-medium text-text-primary">Recent holdings</h2>
            <Link href="/holdings" className="font-mono text-xs text-green-500 hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {holdings.slice(0, 6).map((holding) => {
              const info = infoFor(holding.ticker);
              const price = info?.quote?.price ?? null;
              const value = price != null ? Number(holding.shares) * price : null;
              const linkable = isLinkableTicker(holding.ticker);
              const rowInner = (
                <>
                  <TickerLogo ticker={holding.ticker} logoUrl={info?.logoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</span>
                      <ChangeBadge changePercent={info?.quote?.changePercent ?? null} className="text-xs" />
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                      {holding.shares} shares{value != null ? ` · ${formatCurrency(value)}` : ""}
                    </div>
                  </div>
                  <Sparkline
                    points={info?.sparkline ?? []}
                    id={`dash-${holding.id}`}
                    changePercent={info?.quote?.changePercent ?? null}
                    width={56}
                    height={22}
                  />
                </>
              );
              return linkable ? (
                <Link
                  key={holding.id}
                  href={`/tickers/${holding.ticker}`}
                  className="flex items-center gap-2.5 rounded-card border border-border-subtle bg-surface p-sp-3 transition-colors hover:bg-surface-hover"
                >
                  {rowInner}
                  <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                </Link>
              ) : (
                <div key={holding.id} className="flex items-center gap-2.5 rounded-card border border-border-subtle bg-surface p-sp-3">
                  {rowInner}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
