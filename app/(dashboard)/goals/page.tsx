import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Palmtree, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computeTrailingIncome, computeMonthlyIncomeSeries } from "@/lib/dividend-data/income";
import { enrichTickers } from "@/lib/tickers/enrich";
import { GoalsTabs, GOAL_TABS, type GoalTabKey } from "@/components/dashboard/goals/goals-tabs";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { StatCard } from "@/components/dashboard/market-stats";

export const metadata: Metadata = {
  title: "Goals — PaidPrime",
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const activeTab: GoalTabKey = GOAL_TABS.some((t) => t.key === tabParam) ? (tabParam as GoalTabKey) : "income";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: goals }, { data: profile }] = await Promise.all([
    supabase.from("holdings").select("ticker, shares").eq("user_id", user!.id),
    supabase
      .from("goals")
      .select("goal_type, target_amount, monthly_contribution, monthly_expenses, months_target, current_amount")
      .eq("user_id", user!.id),
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
  ]);

  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Goals & Financial Planning</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to start tracking progress toward your goals.</p>
        </div>
      </div>
    );
  }

  // Two batched requests cover the whole portfolio regardless of ticker
  // count — see lib/tickers/enrich.ts — rather than one request per
  // distinct ticker.
  const distinctTickers = [...new Set(holdings.map((h) => h.ticker))];
  const enriched = await enrichTickers(distinctTickers);

  let portfolioValue = 0;
  for (const holding of holdings) {
    const quote = enriched.get(holding.ticker.toUpperCase())?.quote;
    const shares = Number(holding.shares);
    // Fall back to raw share count for any ticker whose quote lookup
    // failed, so one bad ticker doesn't understate the whole portfolio —
    // same fallback diversification/page.tsx already uses.
    portfolioValue += quote?.price ? shares * quote.price : shares;
  }

  // Income from recorded dividend history via computeTrailingIncome, not
  // Yahoo's trailingAnnualDividendYield field — that field reads 0.00%
  // for most of the weekly/monthly income ETFs and even mainstream ETFs
  // (SCHD, JEPI) this app's real portfolios hold. This page used to
  // compute income the old, wrong way independently of
  // lib/dividend-data/income.ts, understating a real portfolio's income
  // by 14x (verified live 2026-08-01: $0.72/mo shown vs. $10.24/mo
  // actual) — the exact bug already found and fixed on Dashboard and
  // Dividends, just never applied here too.
  const income = await computeTrailingIncome(supabase, holdings);
  const avgYieldPct = portfolioValue > 0 ? (income.annual / portfolioValue) * 100 : 0;
  // Real trailing-12-month trend behind the Passive Income goal's progress
  // — same numbers Dividends' own chart shows, not a separate series.
  const monthlyIncomeSeries = await computeMonthlyIncomeSeries(supabase, holdings);
  const monthlyIncome = income.monthly;

  const incomeGoal = goals?.find((g) => g.goal_type === "passive_income");
  const reserveGoal = goals?.find((g) => g.goal_type === "emergency_reserve");
  const freedomGoal = goals?.find((g) => g.goal_type === "financial_freedom");

  const incomeTarget = incomeGoal ? Number(incomeGoal.target_amount) : null;
  const incomeProgressPct = incomeTarget ? Math.min(100, (monthlyIncome / incomeTarget) * 100) : 0;

  const reserveMonthlyExpenses = reserveGoal ? Number(reserveGoal.monthly_expenses) : null;
  const reserveMonthsTarget = reserveGoal ? Number(reserveGoal.months_target) : 6;
  const reserveCurrentAmount = reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : 0;
  const reserveTarget = reserveMonthlyExpenses ? reserveMonthlyExpenses * reserveMonthsTarget : null;
  const reserveProgressPct = reserveTarget ? Math.min(100, (reserveCurrentAmount / reserveTarget) * 100) : 0;

  const freedomTarget = freedomGoal ? Number(freedomGoal.target_amount) : null;
  const freedomProgressPct = freedomTarget ? Math.min(100, (portfolioValue / freedomTarget) * 100) : 0;

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10">
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Goals & Financial Planning</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track your passive income, emergency reserve, and path to financial freedom.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-3">
        <Link href="/goals?tab=income" className="block">
          <StatCard
            label="Passive Income"
            value={incomeTarget ? `${incomeProgressPct.toFixed(0)}%` : "Not set"}
            sub={incomeTarget ? `$${monthlyIncome.toFixed(0)}/mo of $${incomeTarget.toFixed(0)} goal` : "Set a monthly income goal"}
            icon={Coins}
            iconColor="green"
            compact
            className="transition-colors hover:border-green-500/40"
          />
        </Link>
        <Link href="/goals?tab=reserve" className="block">
          <StatCard
            label="Emergency Reserve"
            value={reserveTarget ? `${reserveProgressPct.toFixed(0)}%` : "Not set"}
            sub={reserveTarget ? `$${reserveCurrentAmount.toFixed(0)} of $${reserveTarget.toFixed(0)} goal` : "Set your monthly expenses"}
            icon={ShieldCheck}
            iconColor="amber"
            compact
            className="transition-colors hover:border-green-500/40"
          />
        </Link>
        <Link href="/goals?tab=freedom" className="block">
          <StatCard
            label="Financial Freedom"
            value={freedomTarget ? `${freedomProgressPct.toFixed(0)}%` : "Not set"}
            sub={freedomTarget ? `$${Math.round(portfolioValue).toLocaleString()} of $${Math.round(freedomTarget).toLocaleString()} goal` : "Set your freedom target"}
            icon={Palmtree}
            iconColor="blue"
            compact
            className="transition-colors hover:border-green-500/40"
          />
        </Link>
      </div>

      <GoalsTabs
        isPro={isPro}
        active={activeTab}
        income={{
          currentMonthlyIncome: monthlyIncome,
          avgYieldPct,
          targetAmount: incomeTarget,
          monthlyContribution: incomeGoal ? Number(incomeGoal.monthly_contribution) : null,
          monthlySeries: monthlyIncomeSeries,
        }}
        reserve={{
          currentReserve: reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : null,
          monthlyExpenses: reserveMonthlyExpenses,
          monthsTarget: reserveGoal ? Number(reserveGoal.months_target) : null,
        }}
        freedom={{
          portfolioValue,
          avgYieldPct,
          targetAmount: freedomTarget,
          monthlyContribution: freedomGoal ? Number(freedomGoal.monthly_contribution) : null,
        }}
      />
    </div>
  );
}
