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

/**
 * Returns the deep link Settings should open for "Connect Telegram" —
 * t.me/PaidPrimeBot?start=<code>. Telegram passes the code through to the
 * bot as `/start <code>`, which the webhook (app/api/telegram/webhook)
 * uses to attribute the resulting chat_id to this user. Reuses any
 * existing unlinked code for this user instead of minting a new one on
 * every click.
 */
export async function getTelegramLinkUrl(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { data: existing } = await supabase
    .from("telegram_links")
    .select("link_code, chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.chat_id) {
    return { error: "Telegram is already connected." };
  }

  const code = existing?.link_code ?? crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  if (!existing) {
    const { error } = await supabase.from("telegram_links").insert({ user_id: user.id, link_code: code });
    if (error) {
      return { error: error.message };
    }
  }

  return { url: `https://t.me/PaidPrimeBot?start=${code}` };
}

export async function disconnectTelegram() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("telegram_links").delete().eq("user_id", user.id);

  revalidatePath("/settings");
}
