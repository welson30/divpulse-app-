import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
      .select("id, institution_name, status, last_synced_at")
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
      <header className="flex flex-col gap-4 border-b border-[#22262c] pb-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Portfolio</p>
          <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
            Portfolio overview
          </h1>
          <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
            Consolidated positions across all connected brokerage accounts.
          </p>
        </div>
        <ExportHoldingsButton holdings={rows} />
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#22262c] bg-[#22262c] lg:grid-cols-4">
        <div className="flex flex-col gap-2 bg-[#121417] px-5 py-5 min-[900px]:px-6">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">Portfolio value</p>
          <p className="text-[22px] leading-[26px] tracking-[-0.52px] text-[#f2f4f7] min-[900px]:text-[26px]">
            {formatMoney(totalValue, true)}
          </p>
        </div>
        <div className="flex flex-col gap-2 bg-[#121417] px-5 py-5 min-[900px]:px-6">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">Cost basis</p>
          <p className="text-[22px] leading-[26px] tracking-[-0.52px] text-[#f2f4f7] min-[900px]:text-[26px]">—</p>
          <p className="text-[12px] leading-[19.8px] tracking-[-0.24px] text-[#99a1ac]">Purchase price not recorded</p>
        </div>
        <div className="flex flex-col gap-2 bg-[#121417] px-5 py-5 min-[900px]:px-6">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">Today&apos;s change</p>
          <p
            className={`text-[22px] leading-[26px] tracking-[-0.52px] min-[900px]:text-[26px] ${
              dayChange == null ? "text-[#f2f4f7]" : dayChange >= 0 ? "text-[#3fbf87]" : "text-red-500"
            }`}
          >
            {dayChange == null
              ? "—"
              : `${dayChange >= 0 ? "+" : ""}${formatMoney(dayChange, true)}`}
          </p>
          <p className="text-[12px] leading-[19.8px] tracking-[-0.24px] text-[#99a1ac]">
            {dayChangePct == null ? "No change data yet" : `${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}%`}
          </p>
        </div>
        <div className="flex flex-col gap-2 bg-[#121417] px-5 py-5 min-[900px]:px-6">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">Annual income</p>
          <p className="text-[22px] leading-[26px] tracking-[-0.52px] text-[#f2f4f7] min-[900px]:text-[26px]">
            {formatMoney(income.annual, true)}
          </p>
        </div>
      </div>

      <PerformanceVsBenchmarkCard
        points={portfolioSeries.points}
        benchmarkPoints={benchmarkPoints}
        excludedTickers={portfolioSeries.excluded}
      />

      <HoldingsTable holdings={rows} actions={actions} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
