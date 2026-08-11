import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { enrichTickers } from "@/lib/tickers/enrich";
import { GoalsBoard } from "@/components/dashboard/goals/goals-board";

export const metadata: Metadata = {
  title: "Goals — PaidPrime",
};

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: goals }] = await Promise.all([
    supabase.from("holdings").select("ticker, shares").eq("user_id", user!.id),
    supabase
      .from("goals")
      .select("goal_type, target_amount, monthly_contribution, monthly_expenses, months_target, current_amount")
      .eq("user_id", user!.id),
  ]);

  const list = holdings ?? [];
  const income = await computeTrailingIncome(supabase, list);

  let portfolioValue = 0;
  if (list.length > 0) {
    const enriched = await enrichTickers([...new Set(list.map((h) => h.ticker))]);
    for (const holding of list) {
      const quote = enriched.get(holding.ticker.toUpperCase())?.quote;
      const shares = Number(holding.shares);
      if (quote?.price) portfolioValue += shares * quote.price;
    }
  }

  const avgYieldPct = portfolioValue > 0 ? (income.annual / portfolioValue) * 100 : 0;
  const incomeGoal = goals?.find((g) => g.goal_type === "passive_income");
  const reserveGoal = goals?.find((g) => g.goal_type === "emergency_reserve");
  const freedomGoal = goals?.find((g) => g.goal_type === "financial_freedom");
  const monthlyExpenses =
    reserveGoal?.monthly_expenses != null
      ? Number(reserveGoal.monthly_expenses)
      : freedomGoal?.monthly_expenses != null
        ? Number(freedomGoal.monthly_expenses)
        : null;
  const monthlyContribution =
    incomeGoal != null
      ? Number(incomeGoal.monthly_contribution)
      : freedomGoal != null
        ? Number(freedomGoal.monthly_contribution)
        : null;

  return (
    <div className="flex flex-col gap-6">
      <GoalsBoard
        monthlyIncome={income.monthly}
        annualIncome={income.annual}
        monthlyTarget={incomeGoal ? Number(incomeGoal.target_amount) : null}
        monthlyContribution={monthlyContribution != null && monthlyContribution > 0 ? monthlyContribution : null}
        monthlyExpenses={monthlyExpenses}
        reserveMonthsTarget={reserveGoal?.months_target != null ? Number(reserveGoal.months_target) : null}
        reserveCurrent={reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : null}
        avgYieldPct={avgYieldPct}
      />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
