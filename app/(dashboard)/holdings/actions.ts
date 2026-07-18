"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HoldingActionState = { error: string } | null;

const FREE_PLAN_HOLDING_CAP = 5;

export async function addHolding(_prevState: HoldingActionState, formData: FormData): Promise<HoldingActionState> {
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const brokerName = String(formData.get("brokerName") ?? "").trim() || null;
  const sharesRaw = String(formData.get("shares") ?? "");
  const shares = Number(sharesRaw);

  if (!ticker) {
    return { error: "Enter a ticker symbol." };
  }
  if (!Number.isFinite(shares) || shares <= 0) {
    return { error: "Enter a positive number of shares." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  // Server-side cap check — the primary user-facing guard. The
  // enforce_holdings_plan_cap DB trigger (see
  // supabase/migrations/20260718000000_holdings.sql) is the real
  // enforcement boundary in case this check is ever bypassed; this one
  // exists so the failure reads as a normal form error, not a raw
  // Postgres exception surfacing in the UI.
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();

  if (profile?.plan === "free") {
    const { count } = await supabase.from("holdings").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= FREE_PLAN_HOLDING_CAP) {
      return { error: `Free plan is limited to ${FREE_PLAN_HOLDING_CAP} tracked assets. Upgrade to Pro for unlimited manual tracking.` };
    }
  }

  const { error } = await supabase.from("holdings").insert({
    user_id: user.id,
    ticker,
    company_name: companyName,
    broker_name: brokerName,
    shares,
    source: "manual",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/holdings");
  revalidatePath("/dashboard");
  return null;
}

export async function deleteHolding(holdingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // RLS ("holdings: delete own rows") is the real access boundary here —
  // this filter is belt-and-suspenders, not the enforcement point.
  await supabase.from("holdings").delete().eq("id", holdingId).eq("user_id", user.id);

  revalidatePath("/holdings");
  revalidatePath("/dashboard");
}
