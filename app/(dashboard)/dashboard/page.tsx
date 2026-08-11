import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeTrailingIncome, computeMonthlyIncomeSeries } from "@/lib/dividend-data/income";
import { estimateNextPayment, estimateUpcomingPayments } from "@/lib/dividend-data/next-payment";
import { enrichTickers } from "@/lib/tickers/enrich";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { PlaidConnectDialog } from "@/components/dashboard/plaid-connect-dialog";
import { PortfolioPerformanceCard } from "@/components/dashboard/portfolio-performance-card";
import { PassiveIncomeChart } from "@/components/dashboard/passive-income-chart";
import { OpenAdvisorButton } from "@/components/dashboard/open-advisor-button";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { Button } from "@/components/ui/button";
import { buildPortfolioSparkline } from "@/lib/tickers/portfolio-sparkline";

export const metadata: Metadata = {
  title: "Dashboard — PaidPrime",
};

function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPayDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatActivityTime(payDate: string, notifiedAt: string | null) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const datePart = payDate === todayIso ? "Today" : formatPayDate(payDate);
  if (!notifiedAt) return datePart;
  const timePart = new Date(notifiedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function formatSyncAgo(iso: string | null) {
  if (!iso) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: profile }, { data: brokerConnections }] = await Promise.all([
    supabase.from("holdings").select("id, ticker, shares, broker_name, company_name").eq("user_id", user!.id),
    supabase.from("profiles").select("display_name, plan").eq("id", user!.id).single(),
    supabase
      .from("broker_connections")
      .select("id, institution_name, status, last_synced_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "there";
  const isProPlus = profile?.plan === "pro_plus";
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const syncedAt = (brokerConnections ?? []).map((c) => c.last_synced_at).filter(Boolean).sort().at(-1) ?? null;
  const syncAgo = formatSyncAgo(syncedAt);
  const brokerCount = (brokerConnections ?? []).length;

  const header = (
    <header className="flex flex-col gap-4 border-b border-[#22262c] pb-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">{dateLabel}</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          {syncAgo
            ? `Portfolio synced ${syncAgo} · read-only across ${brokerCount} ${brokerCount === 1 ? "broker" : "brokers"}.`
            : brokerCount > 0
              ? `Read-only across ${brokerCount} ${brokerCount === 1 ? "broker" : "brokers"}.`
              : "Add a holding or connect a broker to start tracking dividend income."}
        </p>
      </div>
      {syncAgo ? (
        <div className="flex items-center gap-1.5 rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-[7.8px] py-[3px]">
          <span className="size-1.5 rounded-full bg-[#3fbf87]" />
          <span className="text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">Synced {syncAgo}</span>
        </div>
      ) : null}
    </header>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-col items-center gap-3 rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center">
          <p className="max-w-sm text-sm text-[#99a1ac]">No holdings yet. Add a ticker to start tracking dividend income.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild className="h-10">
              <Link href="/holdings">Add first holding</Link>
            </Button>
            <PlaidConnectDialog isProPlus={isProPlus} connections={brokerConnections ?? []} />
          </div>
        </div>
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const upcomingEnd = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [enriched, { data: todayPayments }, { data: recentPayments }, nextPayment, upcoming, income, monthlySeries] =
    await Promise.all([
      enrichTickers(tickers, "1y"),
      supabase
        .from("dividend_payments")
        .select("id, amount, holding_id")
        .eq("user_id", user!.id)
        .eq("pay_date", todayIso),
      supabase
        .from("dividend_payments")
        .select("id, amount, pay_date, holding_id, notified_at")
        .eq("user_id", user!.id)
        .order("pay_date", { ascending: false })
        .limit(6),
      estimateNextPayment(supabase, tickers),
      estimateUpcomingPayments(supabase, tickers, todayIso, upcomingEnd),
      computeTrailingIncome(supabase, holdings),
      computeMonthlyIncomeSeries(supabase, holdings),
    ]);

  const holdingById = new Map(holdings.map((h) => [h.id, h]));
  const infoFor = (ticker: string) => enriched.get(ticker.toUpperCase());

  let portfolioValue = 0;
  let portfolioPrevValue = 0;
  for (const holding of holdings) {
    const quote = infoFor(holding.ticker)?.quote;
    const shares = Number(holding.shares);
    if (quote?.price) portfolioValue += shares * quote.price;
    if (quote?.previousClose) portfolioPrevValue += shares * quote.previousClose;
  }
  const portfolioDayChangePct =
    portfolioPrevValue > 0 ? ((portfolioValue - portfolioPrevValue) / portfolioPrevValue) * 100 : null;

  const portfolioSparkline = buildPortfolioSparkline(holdings, (ticker) => infoFor(ticker)?.sparkline ?? []);
  const annualIncome = income.annual;
  const avgYieldPct = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0;
  const todayTotal = (todayPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const topToday = [...(todayPayments ?? [])].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const topTodayHolding = topToday ? holdingById.get(topToday.holding_id) : null;
  const todaySub =
    todayTotal > 0 && topTodayHolding
      ? `From ${topTodayHolding.company_name ?? topTodayHolding.ticker}${topTodayHolding.company_name ? ` (${topTodayHolding.ticker})` : ""}`
      : "No dividends detected today";

  const nextHolding = nextPayment ? holdings.find((h) => h.ticker === nextPayment.ticker) : null;
  const nextAmount =
    nextPayment && nextHolding ? nextPayment.amountPerShare * Number(nextHolding.shares) : null;

  const sharesByTicker = new Map<string, number>();
  for (const h of holdings) {
    sharesByTicker.set(h.ticker, (sharesByTicker.get(h.ticker) ?? 0) + Number(h.shares));
  }

  const upcomingRows = [...upcoming]
    .sort((a, b) => a.payDate.localeCompare(b.payDate))
    .filter((row, i, list) => list.findIndex((r) => r.ticker === row.ticker) === i)
    .slice(0, 4);

  const advisorInsight = nextPayment && nextAmount != null
    ? `Your next dividend is ${nextPayment.ticker} around ${formatPayDate(nextPayment.payDate)}, about ${formatMoney(nextAmount)}. Ask the advisor how this fits your income plan.`
    : `You're tracking ${holdings.length} holdings with a ${avgYieldPct.toFixed(2)}% trailing yield (${formatMoney(annualIncome, true)}/yr). Ask what to watch next.`;

  const kpis = [
    {
      label: "Portfolio value",
      value: formatMoney(portfolioValue, true),
      sub:
        portfolioDayChangePct != null
          ? `${portfolioDayChangePct >= 0 ? "+" : ""}${portfolioDayChangePct.toFixed(2)}% today`
          : "No change data yet",
      valueClass: "text-[#3fbf87]",
    },
    {
      label: "Today's income",
      value: formatMoney(todayTotal),
      sub: todaySub,
      valueClass: "text-[#f2f4f7]",
    },
    {
      label: "Annual income",
      value: formatMoney(annualIncome, true),
      sub: "Trailing 12 months",
      valueClass: "text-[#f2f4f7]",
    },
    {
      label: "Portfolio yield",
      value: `${avgYieldPct.toFixed(2)}%`,
      sub: "Weighted average",
      valueClass: "text-[#f2f4f7]",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#22262c] bg-[#22262c] lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-[7px] bg-[#121417] px-5 py-5 min-[900px]:px-6">
            <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">{kpi.label}</p>
            <p className={`text-[22px] leading-[26px] tracking-[-0.52px] min-[900px]:text-[26px] ${kpi.valueClass}`}>
              {kpi.value}
            </p>
            <p className="text-[12px] leading-[19.8px] tracking-[-0.24px] text-[#99a1ac]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <PortfolioPerformanceCard points={portfolioSparkline} />
          <PassiveIncomeChart data={monthlySeries} />

          <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="flex items-start justify-between gap-4 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
              <div>
                <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                  Recent activity
                </h2>
                <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Latest confirmed dividend deposits</p>
              </div>
              <Link href="/dividends" className="shrink-0 pt-1.5 text-[13px] text-[#4c82f7] hover:underline">
                View all
              </Link>
            </header>
            {recentPayments && recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(7rem,auto)] border-b border-[#22262c] px-6 py-3 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">
                    <span>Holding</span>
                    <span>Broker</span>
                    <span>Time</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {recentPayments.map((payment) => {
                    const holding = holdingById.get(payment.holding_id);
                    const ticker = holding?.ticker ?? "—";
                    const name = holding?.company_name ?? infoFor(ticker)?.quote?.name ?? ticker;
                    const cells = (
                      <>
                        <span>
                          <span className="block text-[14px] font-medium text-[#f2f4f7]">{ticker}</span>
                          <span className="block truncate text-[12px] text-[#6c737f]">{name}</span>
                        </span>
                        <span className="self-center text-[13px] text-[#99a1ac]">{holding?.broker_name ?? "Unspecified"}</span>
                        <span className="self-center text-[13px] whitespace-nowrap text-[#99a1ac]">
                          {formatActivityTime(payment.pay_date, payment.notified_at)}
                        </span>
                        <span className="self-center text-right text-[14px] tracking-[-0.28px] text-[#3fbf87]">
                          +{formatMoney(Number(payment.amount))}
                        </span>
                      </>
                    );
                    const rowClass =
                      "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(7rem,auto)] border-b border-[#22262c] px-6 py-3.5 last:border-0";
                    return holding && isLinkableTicker(holding.ticker) ? (
                      <Link key={payment.id} href={`/tickers/${holding.ticker}`} className={`${rowClass} hover:bg-[#16191d]`}>
                        {cells}
                      </Link>
                    ) : (
                      <div key={payment.id} className={rowClass}>
                        {cells}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="px-6 py-10 text-center text-sm text-[#99a1ac]">No dividend deposits recorded yet.</p>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Next dividend
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Highest confidence upcoming payment</p>
            </header>
            {nextPayment && nextHolding && nextAmount != null ? (
              <div className="flex flex-col gap-2 px-6 py-5">
                <div className="flex items-start justify-between gap-3 pb-2">
                  <div className="min-w-0">
                    <div className="text-[18px] font-semibold leading-[29.7px] text-[#f2f4f7]">{nextPayment.ticker}</div>
                    <div className="text-[12px] text-[#6c737f]">
                      {nextHolding.company_name ?? infoFor(nextPayment.ticker)?.quote?.name ?? nextPayment.ticker}
                    </div>
                  </div>
                  <div className="text-[20px] tracking-[-0.4px] text-[#3fbf87]">{formatMoney(nextAmount)}</div>
                </div>
                <div className="h-px bg-[#22262c]" />
                <div className="flex items-center gap-2 pt-2 text-[13px] text-[#99a1ac]">
                  <FigmaIcon src="/marketing/dashboard/icon-clock.svg" className="size-[14px]" />
                  {formatPayDate(nextPayment.payDate)} · {nextPayment.source === "confirmed" ? "Confirmed" : "Est."}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[13px] text-[#99a1ac]">
                  <TickerLogo ticker={nextPayment.ticker} logoUrl={infoFor(nextPayment.ticker)?.logoUrl} size="sm" />
                  {nextHolding.broker_name ?? "Unspecified"}
                </div>
              </div>
            ) : (
              <p className="px-6 py-8 text-sm text-[#99a1ac]">No upcoming payments detected yet for your holdings.</p>
            )}
          </section>

          <section className="rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="flex items-center justify-between border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Upcoming payments
              </h2>
              <Link href="/upcoming" className="text-[13px] text-[#4c82f7] hover:underline">
                All
              </Link>
            </header>
            {upcomingRows.length > 0 ? (
              <ul className="px-6 py-2">
                {upcomingRows.map((row, i) => {
                  const amount = row.amountPerShare * (sharesByTicker.get(row.ticker) ?? 0);
                  return (
                    <li
                      key={`${row.ticker}-${row.payDate}`}
                      className={`flex items-center justify-between py-3.5 ${i < upcomingRows.length - 1 ? "border-b border-[#22262c]" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FigmaIcon src="/marketing/dashboard/icon-calendar.svg" className="size-[15px] text-[#99a1ac]" />
                        <div>
                          <div className="text-[13px] font-medium text-[#f2f4f7]">{row.ticker}</div>
                          <div className="text-[11px] text-[#6c737f]">
                            {formatPayDate(row.payDate)} · {row.source === "confirmed" ? "Confirmed" : "Est."}
                          </div>
                        </div>
                      </div>
                      <div className="text-[13px] tracking-[-0.26px] text-[#f2f4f7]">{formatMoney(amount)}</div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-6 py-8 text-sm text-[#99a1ac]">Nothing on the calendar in the next 90 days.</p>
            )}
          </section>

          <section className="rounded-[14px] border border-[#22262c] bg-[#16191d] p-6">
            <div className="mb-3 flex items-center gap-2">
              <FigmaIcon src="/marketing/dashboard/icon-sparkle.svg" className="size-4 text-[#4c82f7]" />
              <p className="text-[11px] tracking-[1.76px] text-[#4c82f7] uppercase">AI Advisor</p>
            </div>
            <p className="mb-4 text-[14px] leading-[22.75px] text-[#f2f4f7]">{advisorInsight}</p>
            <OpenAdvisorButton />
          </section>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma wordmark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={24} height={24} className="h-3.5 w-auto opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">
          Read-only broker access · Data delayed 15 min
        </p>
      </footer>
    </div>
  );
}
