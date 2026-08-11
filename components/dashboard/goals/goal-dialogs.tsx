"use client";

import { useActionState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  saveAnnualIncomeGoal,
  saveFiExpenses,
  saveIncomeGoal,
  type GoalActionState,
} from "@/app/(dashboard)/goals/actions";

const fieldClass =
  "h-11 rounded-[10px] border border-[#2e343b] bg-[#0b0c0e] px-3.5 text-[15px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] focus-visible:border-[#4c82f7]";
const submitClass =
  "mt-4 h-9 rounded-[10px] bg-[#4c82f7] px-4 text-[13px] font-medium text-white hover:bg-[#3d72e8] disabled:opacity-50";

export type GoalEditor = "pick" | "income" | "annual" | "fi";

type GoalDialogsProps = {
  editor: GoalEditor | null;
  onEditorChange: (editor: GoalEditor | null) => void;
  monthlyTarget: number | null;
  monthlyContribution: number | null;
  monthlyExpenses: number | null;
  reserveMonthsTarget: number | null;
  reserveCurrent: number | null;
};

export function GoalDialogs({
  editor,
  onEditorChange,
  monthlyTarget,
  monthlyContribution,
  monthlyExpenses,
  reserveMonthsTarget,
  reserveCurrent,
}: GoalDialogsProps) {
  return (
    <Dialog open={editor != null} onOpenChange={(open) => onEditorChange(open ? editor : null)}>
      <DialogContent className="border-[#22262c] bg-[#121417]">
        {editor === "pick" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-funnel-display)] text-[#f2f4f7]">
                New goal
              </DialogTitle>
              <DialogDescription className="text-[#99a1ac]">
                These three targets are the ones PaidPrime tracks. Annual income is 12× the monthly target.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <PickButton onClick={() => onEditorChange("income")}>Monthly income target</PickButton>
              <PickButton onClick={() => onEditorChange("annual")}>Annual income target</PickButton>
              <PickButton onClick={() => onEditorChange("fi")}>Financial independence</PickButton>
            </div>
          </>
        ) : null}
        {editor === "income" ? (
          <IncomeForm
            annual={false}
            monthlyTarget={monthlyTarget}
            monthlyContribution={monthlyContribution}
            onSaved={() => onEditorChange(null)}
          />
        ) : null}
        {editor === "annual" ? (
          <IncomeForm
            annual
            monthlyTarget={monthlyTarget}
            monthlyContribution={monthlyContribution}
            onSaved={() => onEditorChange(null)}
          />
        ) : null}
        {editor === "fi" ? (
          <FiForm
            monthlyExpenses={monthlyExpenses}
            monthsTarget={reserveMonthsTarget}
            currentAmount={reserveCurrent}
            onSaved={() => onEditorChange(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PickButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] border border-[#2e343b] bg-[#16191d] px-4 py-3 text-left text-[14px] text-[#f2f4f7] hover:border-[#4c82f7]"
    >
      {children}
    </button>
  );
}

function IncomeForm({
  annual,
  monthlyTarget,
  monthlyContribution,
  onSaved,
}: {
  annual: boolean;
  monthlyTarget: number | null;
  monthlyContribution: number | null;
  onSaved: () => void;
}) {
  const action = annual ? saveAnnualIncomeGoal : saveIncomeGoal;
  const [state, formAction, pending] = useActionState<GoalActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (!result) onSaved();
    return result;
  }, null);

  const defaultTarget = annual
    ? monthlyTarget != null
      ? Math.round(monthlyTarget * 12)
      : ""
    : (monthlyTarget ?? "");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-[family-name:var(--font-funnel-display)] text-[#f2f4f7]">
          {annual ? "Annual income target" : "Monthly income target"}
        </DialogTitle>
        <DialogDescription className="text-[#99a1ac]">
          {annual
            ? "Saved as a monthly target (÷12). Same goal as monthly income."
            : "Trailing dividend income against this monthly target."}
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetAmount" className="text-[#99a1ac]">
            {annual ? "Annual income goal ($)" : "Monthly income goal ($)"}
          </Label>
          <input
            id="targetAmount"
            name="targetAmount"
            type="number"
            step="any"
            min="0"
            required
            defaultValue={defaultTarget}
            placeholder={annual ? "7200" : "600"}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monthlyContribution" className="text-[#99a1ac]">
            Planned monthly contribution ($)
          </Label>
          <input
            id="monthlyContribution"
            name="monthlyContribution"
            type="number"
            step="any"
            min="0"
            defaultValue={monthlyContribution ?? ""}
            placeholder="500"
            className={fieldClass}
          />
        </div>
        {state?.error ? (
          <p role="alert" className="text-[13px] text-[#d8695f]">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Saving…" : "Save target"}
        </button>
      </form>
    </>
  );
}

function FiForm({
  monthlyExpenses,
  monthsTarget,
  currentAmount,
  onSaved,
}: {
  monthlyExpenses: number | null;
  monthsTarget: number | null;
  currentAmount: number | null;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState<GoalActionState, FormData>(async (prev, formData) => {
    const result = await saveFiExpenses(prev, formData);
    if (!result) onSaved();
    return result;
  }, null);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-[family-name:var(--font-funnel-display)] text-[#f2f4f7]">
          Financial independence
        </DialogTitle>
        <DialogDescription className="text-[#99a1ac]">
          Coverage is trailing monthly income ÷ these expenses. 100% means dividends cover the month.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="monthsTarget" value={monthsTarget ?? 6} />
        <input type="hidden" name="currentAmount" value={currentAmount ?? 0} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monthlyExpenses" className="text-[#99a1ac]">
            Monthly expenses ($)
          </Label>
          <input
            id="monthlyExpenses"
            name="monthlyExpenses"
            type="number"
            step="any"
            min="0"
            required
            defaultValue={monthlyExpenses ?? ""}
            placeholder="3500"
            className={fieldClass}
          />
        </div>
        {state?.error ? (
          <p role="alert" className="text-[13px] text-[#d8695f]">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Saving…" : "Save target"}
        </button>
      </form>
    </>
  );
}
