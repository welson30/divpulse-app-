"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AiAdvisorPanel } from "@/components/dashboard/ai-advisor-panel";
import { saveReserveGoal, type GoalActionState } from "@/app/(dashboard)/goals/actions";

export type ReserveGoalPanelProps = {
  currentReserve: number | null;
  monthlyExpenses: number | null;
  monthsTarget: number | null;
  isPro: boolean;
};

const MONTH_OPTIONS = [3, 6, 12];

export function ReserveGoalPanel({ currentReserve, monthlyExpenses, monthsTarget, isPro }: ReserveGoalPanelProps) {
  const reserveAmount = currentReserve ?? 0;
  const [state, formAction, pending] = useActionState<GoalActionState, FormData>(saveReserveGoal, null);
  const [selectedMonths, setSelectedMonths] = useState(monthsTarget ?? 6);

  const hasGoal = monthlyExpenses != null && monthlyExpenses > 0;
  const target = hasGoal ? monthlyExpenses * selectedMonths : 0;
  const progressPct = hasGoal && target > 0 ? Math.min(100, (reserveAmount / target) * 100) : 0;
  const stillNeeded = hasGoal ? Math.max(0, target - reserveAmount) : 0;
  const monthsOfProtection = hasGoal && monthlyExpenses > 0 ? reserveAmount / monthlyExpenses : 0;

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary">Reserve target:</span>
        {MONTH_OPTIONS.map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => setSelectedMonths(months)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors",
              selectedMonths === months
                ? "border-green-500/50 bg-[rgba(34,197,94,0.12)] text-green-500"
                : "border-border-subtle text-text-secondary hover:border-border-interactive",
            )}
          >
            {months} months
          </button>
        ))}
      </div>

      {hasGoal ? (
        <>
          <div className="rounded-card border border-green-500/30 bg-surface p-sp-3">
            <div className="flex items-baseline justify-between">
              <div className="text-xs text-text-secondary">
                {selectedMonths}-month reserve · ${reserveAmount.toFixed(0)} of ${target.toFixed(0)}
              </div>
              <span className="font-semibold text-green-500">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-text-secondary">
              <span>Still needed</span>
              <span className="font-semibold text-warning">${stillNeeded.toFixed(0)}</span>
            </div>
          </div>

          <div className="grid gap-sp-2 sm:grid-cols-2">
            <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
              <div className="text-xs text-text-secondary">Monthly expenses</div>
              <div className="mt-1 font-mono text-xl font-bold text-text-primary">${monthlyExpenses.toFixed(0)}</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-surface p-sp-3">
              <div className="text-xs text-text-secondary">Current protection</div>
              <div className="mt-1 font-mono text-xl font-bold text-text-primary">~{monthsOfProtection.toFixed(1)} mo</div>
              <div className="mt-1 text-xs text-text-secondary">of expenses covered</div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3 text-sm text-text-secondary">
          Enter your monthly expenses and current savings below to see your {selectedMonths}-month reserve target.
        </div>
      )}

      <form action={formAction} className="rounded-card border border-border-subtle bg-surface p-sp-3">
        <input type="hidden" name="monthsTarget" value={selectedMonths} />
        <div className="mb-sp-2 text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
          {hasGoal ? "Update goal" : "Set your goal"}
        </div>
        <div className="grid gap-sp-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthlyExpenses">Monthly expenses ($)</Label>
            <Input
              id="monthlyExpenses"
              name="monthlyExpenses"
              type="number"
              step="any"
              min="0"
              defaultValue={monthlyExpenses ?? ""}
              placeholder="3500"
              required
              className="h-11 px-3.5 text-[15px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentAmount">Current reserve balance ($)</Label>
            <Input
              id="currentAmount"
              name="currentAmount"
              type="number"
              step="any"
              min="0"
              defaultValue={currentReserve ?? ""}
              placeholder="14200"
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
            ? `You're ${progressPct.toFixed(1)}% toward your ${selectedMonths}-month reserve. Ask how to close the gap faster.`
            : "Set your monthly expenses above to see your reserve target."
        }
      />
    </div>
  );
}
