"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error: string } | { success: true } | null;

export async function updateProfile(_prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const currency = String(formData.get("currency") ?? "USD");
  const locale = String(formData.get("locale") ?? "en");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, currency, locale })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function removePushDevice(subscriptionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("push_subscriptions").delete().eq("id", subscriptionId).eq("user_id", user.id);

  revalidatePath("/settings");
}
