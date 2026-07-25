"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFreedomGoal, type GoalActionState } from "@/app/(dashboard)/goals/actions";

export type FreedomGoalPanelProps = {
  portfolioValue: number;
  avgYieldPct: number;
  targetAmount: number | null;
  monthlyContribution: number | null;
  isPro: boolean;
};

function yearsToTarget(gap: number, monthlyContribution: number): number | null {
  if (gap <= 0) return 0;
  if (monthlyContribution <= 0) return null;
  return gap / (monthlyContribution * 12);
}

export function FreedomGoalPanel({ portfolioValue, avgYieldPct, targetAmount, monthlyContribution }: FreedomGoalPanelProps) {
  const [state, formAction, pending] = useActionState<GoalActionState, FormData>(saveFreedomGoal, null);

  const hasGoal = targetAmount != null && targetAmount > 0;
  const gap = hasGoal ? Math.max(0, targetAmount - portfolioValue) : 0;
  const currentContribution = monthlyContribution ?? 0;
  const yearsAtCurrentRate = hasGoal ? yearsToTarget(gap, currentContribution) : null;
  const yearsAtDoubleRate = hasGoal ? yearsToTarget(gap, currentContribution * 2) : null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 md:grid-cols-2">
        {hasGoal ? (
          <div className="rounded-card border border-green-500/30 bg-surface p-sp-3">
            <div className="mb-sp-2 font-mono text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
              Wealth projection
            </div>
            <div className="flex justify-between border-b border-border-subtle py-2 text-sm">
              <span className="text-text-secondary">Current portfolio</span>
              <span className="font-semibold text-text-primary">${portfolioValue.toFixed(0)}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle py-2 text-sm">
              <span className="text-text-secondary">Portfolio needed for freedom</span>
              <span className="font-semibold text-text-primary">~${Math.round(targetAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle py-2 text-sm">
              <span className="text-text-secondary">At current contribution</span>
              <span className="font-semibold text-green-500">
                {yearsAtCurrentRate != null
                  ? `${currentYear + Math.ceil(yearsAtCurrentRate)} (${yearsAtCurrentRate.toFixed(1)} yrs)`
                  : "Add a monthly contribution"}
              </span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-text-secondary">At 2× contribution</span>
              <span className="font-semibold text-green-500">
                {yearsAtDoubleRate != null ? `${currentYear + Math.ceil(yearsAtDoubleRate)} (${yearsAtDoubleRate.toFixed(1)} yrs)` : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3 text-sm text-text-secondary">
            Your current portfolio is worth <span className="font-semibold text-green-500">${portfolioValue.toFixed(0)}</span>. Set a
            financial freedom target to see how long it'll take to get there.
          </div>
        )}

        <form action={formAction} className="rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="mb-sp-2 text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
            {hasGoal ? "Update goal" : "Set your goal"}
          </div>
          <div className="flex flex-col gap-sp-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="freedomTarget">Portfolio value for financial freedom ($)</Label>
              <Input
                id="freedomTarget"
                name="targetAmount"
                type="number"
                step="any"
                min="0"
                defaultValue={targetAmount ?? ""}
                placeholder="719000"
                required
                className="h-11 px-3.5 text-[15px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="freedomContribution">Planned monthly contribution ($)</Label>
              <Input
                id="freedomContribution"
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
          <p className="mt-sp-2 text-xs text-text-secondary">
            Tip: portfolio-needed is usually your target annual living cost ÷ your average yield ({avgYieldPct.toFixed(2)}% right now).
          </p>
        </form>
      </div>
    </div>
  );
}
