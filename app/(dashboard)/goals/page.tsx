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

  const incomeTarget = incomeGoal ? Number(incomeGoal.target_amount) : null;
  const incomeProgressPct = incomeTarget ? Math.min(100, (monthlyIncome / incomeTarget) * 100) : 0;
  const incomePlaceholder = incomeTarget
    ? `You're ${incomeProgressPct.toFixed(1)}% of the way to $${incomeTarget.toFixed(0)}/mo. Ask what it'd take to get there faster.`
    : "Set a monthly income goal, then ask what it'd take to reach it.";

  const reserveMonthlyExpenses = reserveGoal ? Number(reserveGoal.monthly_expenses) : null;
  const reserveMonthsTarget = reserveGoal ? Number(reserveGoal.months_target) : 6;
  const reserveCurrentAmount = reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : 0;
  const reserveTarget = reserveMonthlyExpenses ? reserveMonthlyExpenses * reserveMonthsTarget : null;
  const reserveProgressPct = reserveTarget ? Math.min(100, (reserveCurrentAmount / reserveTarget) * 100) : 0;
  const reservePlaceholder = reserveTarget
    ? `You're ${reserveProgressPct.toFixed(1)}% toward your ${reserveMonthsTarget}-month reserve. Ask how to close the gap faster.`
    : "Set your monthly expenses, then ask about your reserve target.";

  const freedomTarget = freedomGoal ? Number(freedomGoal.target_amount) : null;
  const freedomPlaceholder = freedomTarget
    ? `At ${avgYieldPct.toFixed(2)}% yield, you need ~$${Math.round(freedomTarget).toLocaleString()} to be financially free. Ask what it'd take to get there sooner.`
    : "Set your financial freedom target, then ask what it'd take to get there.";

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
        isPro={isPro}
        income={{
          currentMonthlyIncome: monthlyIncome,
          avgYieldPct,
          targetAmount: incomeTarget,
          monthlyContribution: incomeGoal ? Number(incomeGoal.monthly_contribution) : null,
          placeholder: incomePlaceholder,
        }}
        reserve={{
          currentReserve: reserveGoal?.current_amount != null ? Number(reserveGoal.current_amount) : null,
          monthlyExpenses: reserveMonthlyExpenses,
          monthsTarget: reserveGoal ? Number(reserveGoal.months_target) : null,
          placeholder: reservePlaceholder,
        }}
        freedom={{
          portfolioValue,
          avgYieldPct,
          targetAmount: freedomTarget,
          monthlyContribution: freedomGoal ? Number(freedomGoal.monthly_contribution) : null,
          placeholder: freedomPlaceholder,
        }}
      />
    </div>
  );
}
