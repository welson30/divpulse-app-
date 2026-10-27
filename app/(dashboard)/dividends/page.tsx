import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { isLinkableTicker } from "@/lib/tickers/validate";
import {
  computeTrailingIncome,
  computeMonthlyIncomeSeries,
  computeAnnualIncomeSeries,
  computeCadenceIncome,
} from "@/lib/dividend-data/income";
import { PassiveIncomeChart } from "@/components/dashboard/passive-income-chart";
import { DividendGrowthChart } from "@/components/dashboard/dividend-growth-chart";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { AnimatedKpiTiles } from "@/components/dashboard/animated-kpi-tiles";

export const metadata: Metadata = {
  title: "Dividends — PaidPrime",
};

function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DividendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, company_name")
    .eq("user_id", user!.id);

  const header = (
    <header className="relative overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] px-5 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)] min-[900px]:px-6">
      {/* Ambient gradient mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-[#3fbf87] opacity-[0.04] blur-3xl" />
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-[#60a5fa] opacity-[0.035] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-48 rounded-full bg-[#a78bfa] opacity-[0.03] blur-2xl" />
      </div>
      <div className="relative z-[1]">
        <p className="text-[11px] tracking-[2.2px] text-[#3d4554] uppercase">Dividends</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#e8eaf0] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Dividend income
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#3d4554]">
          Trailing twelve months, forward projection and per-holding contribution.
        </p>
      </div>
    </header>
  );

  const footer = (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1c2028] pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
      <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
      <p className="text-[12px] leading-[19.8px] text-[#3d4554]">Read-only broker access · Data delayed 15 min</p>
    </footer>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="rounded-[18px] border border-[#1c2028] bg-[#0b0e12] px-6 py-12 text-center text-sm text-[#3d4554]">
          Add a holding to start tracking dividend income.
        </div>
        {footer}
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const [enriched, income, monthlySeries, annualSeries] = await Promise.all([
    enrichTickers(tickers),
    computeTrailingIncome(supabase, holdings),
    computeMonthlyIncomeSeries(supabase, holdings),
    computeAnnualIncomeSeries(supabase, holdings),
  ]);
  const cadenceLive = await computeCadenceIncome(supabase, holdings, income.perTicker);

  const infoFor = (ticker: string) => enriched.get(ticker.toUpperCase());

  let portfolioValue = 0;
  for (const holding of holdings) {
    const price = infoFor(holding.ticker)?.quote?.price;
    if (price) portfolioValue += Number(holding.shares) * price;
  }
  const avgYieldPct = portfolioValue > 0 ? (income.annual / portfolioValue) * 100 : null;

  const completeYears = annualSeries.filter((p) => p.complete && p.total > 0);
  const firstYear = completeYears[0];
  const lastYear = completeYears.at(-1);
  const growthPct =
    firstYear && lastYear && firstYear.year !== lastYear.year && firstYear.total > 0
      ? ((lastYear.total - firstYear.total) / firstYear.total) * 100
      : null;
  const growthSpan = firstYear && lastYear && firstYear.year !== lastYear.year ? lastYear.year - firstYear.year + 1 : null;

  const chartYears = annualSeries.filter((p, i) => p.total > 0 || annualSeries.slice(0, i).some((x) => x.total > 0));

  const rows = [...new Map(holdings.map((h) => [h.ticker, h])).values()]
    .map((h) => {
      const info = infoFor(h.ticker);
      const shares = holdings
        .filter((row) => row.ticker === h.ticker)
        .reduce((sum, row) => sum + Number(row.shares), 0);
      const price = info?.quote?.price ?? null;
      const marketValue = price != null ? price * shares : null;
      const annual = income.perTicker.get(h.ticker) ?? 0;
      return {
        ticker: h.ticker,
        name: info?.name ?? h.company_name ?? h.ticker,
        annual,
        monthly: annual / 12,
        yieldPct: marketValue != null && marketValue > 0 ? (annual / marketValue) * 100 : null,
      };
    })
    .sort((a, b) => b.annual - a.annual);

  const topNames = rows
    .filter((r) => r.annual > 0)
    .slice(0, 2)
    .map((r) => r.ticker);

  const trendBody =
    growthPct != null && firstYear && lastYear
      ? `Annual dividend income has ${growthPct >= 0 ? "grown" : "declined"} ${Math.abs(growthPct).toFixed(0)}% from ${firstYear.year} to ${lastYear.year}${
          cadenceLive.dominantLabel ? `, driven mostly by ${cadenceLive.dominantLabel}` : ""
        }${topNames.length > 0 ? ` (${topNames.join(", ")})` : ""}.`
      : cadenceLive.dominantLabel
        ? `Most of your trailing twelve-month income comes from ${cadenceLive.dominantLabel}${
            topNames.length > 0 ? `, led by ${topNames.join(" and ")}` : ""
          }.`
        : "Income is trailing twelve months of recorded dividend events at your current share counts.";

  const kpis = [
    {
      label: "TTM income",
      value: formatMoney(income.annual, true),
      sub: "Recorded last 12 months",
      valueClass: "text-[#f2f4f7]",
    },
    {
      label: "Forward income",
      value: formatMoney(cadenceLive.forwardAnnual, true),
      sub: "Estimated next 12mo",
      valueClass: "text-[#f2f4f7]",
    },
    {
      label: "Average yield",
      value: avgYieldPct != null ? `${avgYieldPct.toFixed(2)}%` : "—",
      sub: "Trailing income / value",
      valueClass: "text-[#f2f4f7]",
    },
    {
      label: growthSpan != null ? `${growthSpan}yr growth rate` : "Growth rate",
      value: growthPct != null ? `${growthPct >= 0 ? "+" : ""}${Math.round(growthPct)}%` : "—",
      sub:
        firstYear && lastYear && firstYear.year !== lastYear.year
          ? `${firstYear.year} → ${lastYear.year} annual income`
          : "Need two complete years",
      valueClass: growthPct != null && growthPct < 0 ? "text-[#d8695f]" : "text-[#3fbf87]",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {header}

      <AnimatedKpiTiles kpis={kpis} />

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <PassiveIncomeChart
            data={monthlySeries}
            title="Monthly income"
            subtitle="Dividends received per month, trailing 12 months"
            chartClassName="h-[240px] min-[900px]:h-[240px]"
          />
          <DividendGrowthChart data={chartYears.length > 0 ? chartYears : annualSeries} />

          <section className="overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <header className="border-b border-[#1c2028] px-5 py-5 min-[900px]:px-6">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#e8eaf0]">
                Income by holding
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#3d4554]">
                Ranked by trailing annual contribution
              </p>
            </header>
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(5.5rem,0.6fr)_minmax(6.5rem,0.7fr)_minmax(6rem,0.7fr)] border-b border-[#1c2028] px-6 py-3 text-[11px] font-bold tracking-[1.54px] text-[#3d4554] uppercase">
                  <span>Holding</span>
                  <span className="text-right">Yield</span>
                  <span className="text-right">Monthly</span>
                  <span className="text-right">Annual</span>
                </div>
                {rows.length === 0 ? (
                  <p className="px-6 py-8 text-[13px] text-[#3d4554]">No holdings to rank yet.</p>
                ) : (
                  rows.map((row, i) => {
                    const holding = (
                      <>
                        <span className="block text-[14px] font-medium leading-[23.1px] text-[#e8eaf0]">{row.ticker}</span>
                        <span className="block truncate text-[12px] leading-[19.8px] text-[#3d4554]">{row.name}</span>
                      </>
                    );
                    return (
                      <div
                        key={row.ticker}
                        className={`grid grid-cols-[minmax(0,1.6fr)_minmax(5.5rem,0.6fr)_minmax(6.5rem,0.7fr)_minmax(6rem,0.7fr)] items-center px-6 py-3.5 transition-colors hover:bg-[#0e1219] ${
                          i < rows.length - 1 ? "border-b border-[#1c2028]" : ""
                        }`}
                      >
                        {isLinkableTicker(row.ticker) ? (
                          <Link href={`/tickers/${row.ticker}`} className="min-w-0 pr-4 hover:opacity-80">
                            {holding}
                          </Link>
                        ) : (
                          <div className="min-w-0 pr-4">{holding}</div>
                        )}
                        <span className="text-right text-[13px] tracking-[-0.26px] text-[#3fbf87]" style={{ filter: "drop-shadow(0 0 6px rgba(63,191,135,0.35))" }}>
                          {row.yieldPct != null ? `${row.yieldPct.toFixed(2)}%` : "—"}
                        </span>
                        <span className="text-right text-[13px] tracking-[-0.26px] text-[#3d4554]">
                          {formatMoney(row.monthly)}
                        </span>
                        <span className="text-right text-[14px] tracking-[-0.28px] text-[#e8eaf0]">
                          {formatMoney(row.annual, true)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <header className="border-b border-[#1c2028] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#e8eaf0]">
                Payout frequency mix
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#3d4554]">Share of annual income by cadence</p>
            </header>
            <div className="flex flex-col gap-5 p-6">
              {cadenceLive.mix.map((row) => (
                <div key={row.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] leading-[21.45px] text-[#e8eaf0]">{row.label}</span>
                    <span className="text-[13px] tracking-[-0.26px] text-[#3d4554]">{Math.round(row.pct)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#141820]">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, row.pct)}%`,
                        background: `linear-gradient(to right, ${row.color}aa, ${row.color})`,
                        boxShadow: `0 0 8px ${row.color}55`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            {/* Subtle blue ambient glow */}
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-[#60a5fa] opacity-[0.04] blur-2xl" />
            <div className="relative z-[1]">
              <div className="flex items-center gap-2">
                <FigmaIcon src="/marketing/dashboard/icon-trend.svg" className="size-4 text-[#60a5fa]" />
                <p className="text-[11px] tracking-[1.76px] text-[#60a5fa] uppercase">Income trend</p>
              </div>
              <p className="mt-3 text-[14px] leading-[22.75px] text-[#c8ccd8]">{trendBody}</p>
              <div className="mt-4 h-px bg-[#1c2028]" />
              <p className="mt-3 text-[12px] leading-[19.8px] text-[#3d4554]">
                Figures use current share counts. Reinvested distributions are excluded. Forward income is estimated from
                recent payout cadence.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {footer}
    </div>
  );
}
