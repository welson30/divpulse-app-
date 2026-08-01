"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";
import { MonthlyIncomeChart, type MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";
import { saveIncomeGoal, type GoalActionState } from "@/app/(dashboard)/goals/actions";

export type IncomeGoalPanelProps = {
  currentMonthlyIncome: number;
  avgYieldPct: number;
  targetAmount: number | null;
  monthlyContribution: number | null;
  monthlySeries: MonthlyIncomePoint[];
  isPro: boolean;
};

export function IncomeGoalPanel({
  currentMonthlyIncome,
  avgYieldPct,
  targetAmount,
  monthlyContribution,
  monthlySeries,
}: IncomeGoalPanelProps) {
  const [state, formAction, pending] = useActionState<GoalActionState, FormData>(saveIncomeGoal, null);

  const hasGoal = targetAmount != null && targetAmount > 0;
  const progressPct = hasGoal ? Math.min(100, (currentMonthlyIncome / targetAmount) * 100) : 0;

  // Capital needed at current yield to produce the target monthly income —
  // same "capital needed" figure the prototype shows, derived from the
  // portfolio's own actual average yield rather than an assumed constant.
  const capitalNeeded = hasGoal && avgYieldPct > 0 ? (targetAmount * 12) / (avgYieldPct / 100) : null;

  // Months to close the income gap, assuming the stated monthly
  // contribution is invested at the same average yield the portfolio
  // already earns — a simplification (ignores price appreciation,
  // reinvestment compounding, yield drift) but matches the "estimate,
  // not guarantee" framing the AI Advisor's system prompt also uses.
  const monthlyGap = hasGoal ? Math.max(0, targetAmount - currentMonthlyIncome) : 0;
  const monthsToGoal =
    hasGoal && monthlyContribution && monthlyContribution > 0 && avgYieldPct > 0
      ? Math.ceil((monthlyGap * 12) / (avgYieldPct / 100) / monthlyContribution)
      : null;

  return (
    <div className="flex flex-col gap-sp-3">
      {hasGoal ? (
        <>
          <div className="rounded-card border border-green-500/30 bg-surface p-sp-3">
            <div className="flex items-baseline justify-between">
              <div className="inline-flex items-center gap-1 text-xs text-text-secondary">
                Monthly income goal <InfoTip label={TIPS.passiveIncomeGoal} />
              </div>
              <span className="font-semibold text-green-500">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-text-primary">${targetAmount.toFixed(0)}/mo</div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-text-secondary">
              Currently earning ${currentMonthlyIncome.toFixed(0)}/mo of ${targetAmount.toFixed(0)} target
            </div>
          </div>

          <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-2">
            <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
              <div className="inline-flex items-center gap-1 text-xs text-text-secondary">
                Time to goal <InfoTip label={TIPS.goalTimeToGoal} />
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-text-primary">
                {monthsToGoal != null ? `~${(monthsToGoal / 12).toFixed(1)} yrs` : "Add a monthly contribution"}
              </div>
              <div className="mt-1 text-xs text-text-secondary">At your current contribution rate</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
              <div className="inline-flex items-center gap-1 text-xs text-text-secondary">
                Capital needed <InfoTip label={TIPS.goalCapitalNeeded} />
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-text-primary">
                {capitalNeeded != null ? `~$${Math.round(capitalNeeded).toLocaleString()}` : "—"}
              </div>
              <div className="mt-1 text-xs text-text-secondary">At {avgYieldPct.toFixed(2)}% avg yield</div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3 text-sm text-text-secondary">
          You&rsquo;re currently earning <span className="font-semibold text-green-500">${currentMonthlyIncome.toFixed(0)}/mo</span> in
          dividends. Set a target below to track your progress.
        </div>
      )}

      <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <div className="mb-sp-2 text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
          Income trend (last 12 months)
        </div>
        <MonthlyIncomeChart data={monthlySeries} />
      </div>

      <form action={formAction} className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <div className="mb-sp-2 text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
          {hasGoal ? "Update goal" : "Set your goal"}
        </div>
        <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetAmount">Monthly income goal ($)</Label>
            <Input
              id="targetAmount"
              name="targetAmount"
              type="number"
              step="any"
              min="0"
              defaultValue={targetAmount ?? ""}
              placeholder="1000"
              required
              className="h-11 px-3.5 text-[15px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthlyContribution">Planned monthly contribution ($)</Label>
            <Input
              id="monthlyContribution"
              name="monthlyContribution"
              type="number"
              step="any"
              min="0"
              defaultValue={monthlyContribution ?? ""}
              placeholder="500"
              className="h-11 px-3.5 text-[15px]"
            />
          </div>
        </div>
        {state?.error ? (
          <p role="alert" className="mt-sp-2 text-sm text-red-500">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-sp-2 h-10 text-[13px]">
          {pending ? "Saving…" : "Save goal"}
        </Button>
      </form>
    </div>
  );
}
