import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AnimatedKpiTiles } from "@/components/dashboard/animated-kpi-tiles";
import { enrichTickers } from "@/lib/tickers/enrich";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { buildPortfolioSeries, scaleBenchmarkAligned } from "@/lib/tickers/portfolio-sparkline";
import { HoldingsTable, type Holding } from "@/components/dashboard/holdings-table";
import { AddHoldingDialog } from "@/components/dashboard/add-holding-dialog";
import { ImportCsvDialog } from "@/components/dashboard/import-csv-dialog";
import { PlaidConnectDialog } from "@/components/dashboard/plaid-connect-dialog";
import { PerformanceVsBenchmarkCard } from "@/components/dashboard/performance-vs-benchmark-card";
import { ExportHoldingsButton } from "@/components/dashboard/export-holdings-button";

export const metadata: Metadata = {
  title: "Portfolio — PaidPrime",
};

function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function HoldingsPage() {
  const supabase = await createClient();
  const [t, tc] = await Promise.all([
    getTranslations("dashboard.holdings"),
    getTranslations("dashboard.common"),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: profile }, { data: brokerConnections }] = await Promise.all([
    supabase
      .from("holdings")
      .select("id, ticker, company_name, broker_name, shares, source")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan, default_broker_name").eq("id", user!.id).single(),
    supabase
      .from("broker_connections")
      .select("id, institution_name, status, last_synced_at, needs_reauth")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const isProPlus = profile?.plan === "pro_plus";
  const list = holdings ?? [];
  const tickers = [...new Set(list.map((h) => h.ticker))];

  const [enriched, income] = await Promise.all([
    enrichTickers([...tickers, "SPY"], "1y"),
    computeTrailingIncome(supabase, list),
  ]);

  const infoFor = (ticker: string) => enriched.get(ticker.toUpperCase());

  const rows: Holding[] = list.map((h) => {
    const info = infoFor(h.ticker);
    const quote = info?.quote;
    const shares = Number(h.shares);
    const marketValue = quote?.price != null ? quote.price * shares : null;
    const annualIncome = income.perTicker.get(h.ticker) ?? 0;
    return {
      ...h,
      name: info?.name ?? h.company_name ?? null,
      logoUrl: info?.logoUrl ?? null,
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      marketValue,
      sparkline: info?.sparkline ?? [],
      annualIncome,
      yieldPct: null as number | null,
      weightPct: null as number | null,
    };
  });

  const totalValue = rows.reduce((sum, r) => sum + (r.marketValue ?? 0), 0);
  for (const row of rows) {
    row.weightPct = totalValue > 0 && row.marketValue != null ? (row.marketValue / totalValue) * 100 : null;
    row.yieldPct =
      row.marketValue != null && row.marketValue > 0 && row.annualIncome != null
        ? (row.annualIncome / row.marketValue) * 100
        : null;
  }

  // Same basis as the dashboard's "Portfolio yield" (trailing 12mo recorded
  // income over current market value), so the two pages can't disagree.
  const portfolioYieldPct = totalValue > 0 ? (income.annual / totalValue) * 100 : null;

  let portfolioPrevValue = 0;
  for (const holding of list) {
    const quote = infoFor(holding.ticker)?.quote;
    const shares = Number(holding.shares);
    if (quote?.previousClose) portfolioPrevValue += shares * quote.previousClose;
  }
  const dayChange = portfolioPrevValue > 0 ? totalValue - portfolioPrevValue : null;
  const dayChangePct = portfolioPrevValue > 0 ? (dayChange! / portfolioPrevValue) * 100 : null;

  const portfolioSeries = buildPortfolioSeries(list, (ticker) => infoFor(ticker)?.sparkline ?? []);
  const spySparkline = infoFor("SPY")?.sparkline ?? [];
  const benchmarkPoints = scaleBenchmarkAligned(portfolioSeries.points, spySparkline);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <PlaidConnectDialog isProPlus={isProPlus} connections={brokerConnections ?? []} />
      <ImportCsvDialog isProPlus={isProPlus} />
      <AddHoldingDialog defaultBroker={profile?.default_broker_name ?? undefined} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="relative overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#0b0e12] shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        {/* Ambient gradient mesh */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 size-72 rounded-full bg-[#3fbf87] opacity-[0.04] blur-3xl" />
          <div className="absolute -right-10 -top-10 size-64 rounded-full bg-[#60a5fa] opacity-[0.035] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-48 rounded-full bg-[#a78bfa] opacity-[0.03] blur-2xl" />
        </div>
        <div className="relative z-[1] flex flex-col gap-4 px-5 py-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:px-6">
          <div className="min-w-0">
            <p className="text-[11px] tracking-[2.2px] text-[#3d4554] uppercase">{t("eyebrow")}</p>
            <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#e8eaf0] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#3d4554]">
              {t("subtitle")}
            </p>
          </div>
          <ExportHoldingsButton holdings={rows} />
        </div>
      </header>

      <AnimatedKpiTiles kpis={[
        {
          label: tc("portfolioValue"),
          value: formatMoney(totalValue, true),
          sub: t("currentMarketValue"),
          valueClass: "text-[#e8eaf0]",
        },
        {
          label: tc("portfolioYield"),
          value: portfolioYieldPct != null ? `${portfolioYieldPct.toFixed(2)}%` : "—",
          sub: portfolioYieldPct != null ? t("trailing12moYield") : t("waitingLivePrices"),
          valueClass: "text-[#e8eaf0]",
        },
        {
          label: t("todaysChange"),
          value: dayChange == null ? "—" : `${dayChange >= 0 ? "+" : ""}${formatMoney(dayChange, true)}`,
          sub: dayChangePct == null ? tc("noChangeData") : `${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}${t("vsYesterday")}`,
          valueClass: dayChange == null ? "text-[#e8eaf0]" : dayChange >= 0 ? "text-[#3fbf87]" : "text-red-400",
        },
        {
          label: tc("annualIncome"),
          value: formatMoney(income.annual, true),
          sub: tc("trailing12Months"),
          valueClass: "text-[#e8eaf0]",
        },
      ]} />

      <PerformanceVsBenchmarkCard
        points={portfolioSeries.points}
        benchmarkPoints={benchmarkPoints}
        excludedTickers={portfolioSeries.excluded}
      />

      <HoldingsTable holdings={rows} actions={actions} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1c2028] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#3d4554]">{tc("footerDisclaimer")}</p>
      </footer>
    </div>
  );
}
