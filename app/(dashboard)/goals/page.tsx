import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { GoalsTabs } from "@/components/dashboard/goals/goals-tabs";

export const metadata: Metadata = {
  title: "Goals — PaidPrime",
};

export default async function GoalsPage() {
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

  const provider = getDividendDataProvider();
  const distinctTickers = [...new Set(holdings.map((h) => h.ticker))];
  const quotes = await Promise.all(
    distinctTickers.map(async (ticker) => {
      try {
        return await provider.fetchQuote(ticker);
      } catch {
        return null;
      }
    }),
  );
  const quoteByTicker = new Map(distinctTickers.map((ticker, i) => [ticker, quotes[i]]));

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
  const monthlyIncome = annualIncome / 12;

  const incomeGoal = goals?.find((g) => g.goal_type === "passive_income");
  const reserveGoal = goals?.find((g) => g.goal_type === "emergency_reserve");
  const freedomGoal = goals?.find((g) => g.goal_type === "financial_freedom");

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Goals & Financial Planning</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track your passive income, emergency reserve, and path to financial freedom.
        </p>
      </div>

      <GoalsTabs
        income={{
          currentMonthlyIncome: monthlyIncome,
          avgYieldPct,
          targetAmount: incomeGoal ? Number(incomeGoal.target_amount) : null,
          monthlyContribution: incomeGoal ? Number(incomeGoal.monthly_contribution) : null,
          isPro,
        }}
        reserve={{
          currentReserve: reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : null,
          monthlyExpenses: reserveGoal ? Number(reserveGoal.monthly_expenses) : null,
          monthsTarget: reserveGoal ? Number(reserveGoal.months_target) : null,
          isPro,
        }}
        freedom={{
          portfolioValue,
          avgYieldPct,
          targetAmount: freedomGoal ? Number(freedomGoal.target_amount) : null,
          monthlyContribution: freedomGoal ? Number(freedomGoal.monthly_contribution) : null,
          isPro,
        }}
      />
    </div>
  );
}
