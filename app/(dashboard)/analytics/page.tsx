import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { computeMonthlyIncomeSeries, computeAnnualIncomeSeries } from "@/lib/dividend-data/income";
import { buildPortfolioSeries } from "@/lib/tickers/portfolio-sparkline";
import { AnalyticsBoard } from "@/components/dashboard/analytics-board";

export const metadata: Metadata = {
  title: "Analytics — PaidPrime",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase.from("holdings").select("ticker, shares").eq("user_id", user!.id);

  const footer = (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
      <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
      <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
    </footer>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <AnalyticsBoard monthly={[]} annual={[]} portfolio={[]} />
        {footer}
      </div>
    );
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const [monthly, annual, enriched] = await Promise.all([
    computeMonthlyIncomeSeries(supabase, holdings, 36),
    computeAnnualIncomeSeries(supabase, holdings, 6),
    enrichTickers(tickers, "1y"),
  ]);
  const portfolio = buildPortfolioSeries(holdings, (ticker) => enriched.get(ticker.toUpperCase())?.sparkline ?? []).points;

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsBoard monthly={monthly} annual={annual} portfolio={portfolio} />
      {footer}
    </div>
  );
}
