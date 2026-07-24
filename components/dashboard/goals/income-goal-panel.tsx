"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiAdvisorPanel } from "@/components/dashboard/ai-advisor-panel";
import { saveIncomeGoal, type GoalActionState } from "@/app/(dashboard)/goals/actions";

export type IncomeGoalPanelProps = {
  currentMonthlyIncome: number;
  avgYieldPct: number;
  targetAmount: number | null;
  monthlyContribution: number | null;
  isPro: boolean;
};

export function IncomeGoalPanel({ currentMonthlyIncome, avgYieldPct, targetAmount, monthlyContribution, isPro }: IncomeGoalPanelProps) {
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
      <div className="grid gap-sp-2 sm:grid-cols-3">
        <div className="rounded-card border border-green-500/30 bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Monthly income goal</div>
          <div className="mt-1 font-mono text-xl font-bold text-text-primary">{hasGoal ? `$${targetAmount.toFixed(0)}` : "—"}</div>
          {hasGoal ? (
            <>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-1.5 text-xs text-text-secondary">
                ${currentMonthlyIncome.toFixed(0)} of ${targetAmount.toFixed(0)} · <span className="text-green-500">{progressPct.toFixed(1)}%</span>
              </div>
            </>
          ) : (
            <div className="mt-1 text-xs text-text-secondary">Set a target below</div>
          )}
        </div>
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Time to goal</div>
          <div className="mt-1 font-mono text-xl font-bold text-text-primary">
            {monthsToGoal != null ? `~${(monthsToGoal / 12).toFixed(1)} yrs` : "—"}
          </div>
          <div className="mt-1 text-xs text-text-secondary">At current contribution rate</div>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="text-xs text-text-secondary">Capital needed</div>
          <div className="mt-1 font-mono text-xl font-bold text-text-primary">
            {capitalNeeded != null ? `~$${Math.round(capitalNeeded).toLocaleString()}` : "—"}
          </div>
          <div className="mt-1 text-xs text-text-secondary">At {avgYieldPct.toFixed(2)}% avg yield</div>
        </div>
      </div>

      <form action={formAction} className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <div className="grid gap-sp-2 sm:grid-cols-2">
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

      <AiAdvisorPanel
        isPro={isPro}
        placeholder={
          hasGoal
            ? `You're ${progressPct.toFixed(1)}% of the way to $${targetAmount.toFixed(0)}/mo. Ask what it'd take to get there faster.`
            : "Set a monthly income goal above, then ask what it'd take to reach it."
        }
      />
    </div>
  );
}
