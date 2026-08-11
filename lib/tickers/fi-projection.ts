/**
 * Expense-coverage path: current TTM monthly income plus income from
 * planned contributions at the portfolio's current blended yield.
 * No assumed price appreciation or dividend growth — same conservative
 * framing as the income-goal time-to-target math.
 */
export type CoveragePoint = {
  year: number;
  label: string;
  coveragePct: number;
};

export function projectExpenseCoverage({
  monthlyIncome,
  monthlyExpenses,
  avgYieldPct,
  monthlyContribution,
  years = 10,
}: {
  monthlyIncome: number;
  monthlyExpenses: number;
  avgYieldPct: number;
  monthlyContribution: number;
  years?: number;
}): { points: CoveragePoint[]; yearsToFi: number | null } {
  if (!(monthlyExpenses > 0) || years < 1) return { points: [], yearsToFi: null };

  const yieldFrac = avgYieldPct > 0 ? avgYieldPct / 100 : 0;
  const incomePerYear = monthlyContribution > 0 ? monthlyContribution * yieldFrac : 0;
  const points: CoveragePoint[] = [];
  for (let i = 0; i < years; i += 1) {
    const income = monthlyIncome + i * incomePerYear;
    points.push({
      year: i + 1,
      label: `Y${i + 1}`,
      coveragePct: (income / monthlyExpenses) * 100,
    });
  }

  if (monthlyIncome >= monthlyExpenses) return { points, yearsToFi: 0 };
  if (!(incomePerYear > 0)) return { points, yearsToFi: null };

  const yearsToFi = (monthlyExpenses - monthlyIncome) / incomePerYear;
  return { points, yearsToFi };
}
