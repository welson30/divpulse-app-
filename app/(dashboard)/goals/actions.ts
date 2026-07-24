"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GoalActionState = { error: string } | null;

export async function saveIncomeGoal(_prevState: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const targetAmount = Number(formData.get("targetAmount"));
  const monthlyContribution = Number(formData.get("monthlyContribution") ?? 0);

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return { error: "Enter a monthly income goal greater than $0." };
  }
  if (!Number.isFinite(monthlyContribution) || monthlyContribution < 0) {
    return { error: "Monthly contribution can't be negative." };
  }

  return upsertGoal("passive_income", { target_amount: targetAmount, monthly_contribution: monthlyContribution });
}

export async function saveReserveGoal(_prevState: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const monthlyExpenses = Number(formData.get("monthlyExpenses"));
  const monthsTarget = Number(formData.get("monthsTarget"));
  const currentAmount = Number(formData.get("currentAmount") ?? 0);

  if (!Number.isFinite(monthlyExpenses) || monthlyExpenses <= 0) {
    return { error: "Enter your monthly expenses." };
  }
  if (!Number.isFinite(monthsTarget) || monthsTarget <= 0) {
    return { error: "Choose a reserve target in months." };
  }
  if (!Number.isFinite(currentAmount) || currentAmount < 0) {
    return { error: "Current reserve can't be negative." };
  }

  return upsertGoal("emergency_reserve", {
    target_amount: monthlyExpenses * monthsTarget,
    monthly_expenses: monthlyExpenses,
    months_target: monthsTarget,
    current_amount: currentAmount,
  });
}

export async function saveFreedomGoal(_prevState: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const targetAmount = Number(formData.get("targetAmount"));
  const monthlyContribution = Number(formData.get("monthlyContribution") ?? 0);

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return { error: "Enter the portfolio value you're targeting." };
  }
  if (!Number.isFinite(monthlyContribution) || monthlyContribution < 0) {
    return { error: "Monthly contribution can't be negative." };
  }

  return upsertGoal("financial_freedom", { target_amount: targetAmount, monthly_contribution: monthlyContribution });
}

async function upsertGoal(
  goalType: "passive_income" | "emergency_reserve" | "financial_freedom",
  fields: {
    target_amount: number;
    monthly_contribution?: number;
    monthly_expenses?: number;
    months_target?: number;
    current_amount?: number;
  },
): Promise<GoalActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("goals")
    .upsert({ user_id: user.id, goal_type: goalType, ...fields }, { onConflict: "user_id,goal_type" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/goals");
  return null;
}
