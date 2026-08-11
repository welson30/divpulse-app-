"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error: string } | { success: true } | null;

export async function updateProfile(_prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  // Optional — blank clears it back to the email-derived fallback the UI
  // already shows everywhere display_name is null.
  const displayName = String(formData.get("displayName") ?? "").trim();
  const defaultBroker = String(formData.get("defaultBroker") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, default_broker_name: defaultBroker || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(_prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateCalendarPrivacyMode(_prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const calendarPrivacyMode = String(formData.get("calendarPrivacyMode") ?? "full");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase.from("profiles").update({ calendar_privacy_mode: calendarPrivacyMode }).eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/calendar");
  return { success: true };
}

export async function updateNotificationStyle(_prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const notificationStyle = String(formData.get("notificationStyle") ?? "");
  if (!["compact", "descriptive", "premium"].includes(notificationStyle)) {
    return { error: "Invalid notification style." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase.from("profiles").update({ notification_style: notificationStyle }).eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/alert-templates");
  return { success: true };
}

export async function setNotificationStyle(notificationStyle: string): Promise<SettingsActionState> {
  const formData = new FormData();
  formData.set("notificationStyle", notificationStyle);
  return updateNotificationStyle(null, formData);
}

export async function disablePushAlerts(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/alert-templates");
  return null;
}

export async function removePushDevice(subscriptionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("push_subscriptions").delete().eq("id", subscriptionId).eq("user_id", user.id);

  revalidatePath("/settings");
  revalidatePath("/alert-templates");
}

/**
 * Returns the deep link Settings should open for "Connect Telegram" —
 * t.me/DivPulseWelson_bot?start=<code>. That's the bot's actual Telegram
 * @username (verified via the Bot API's getMe) — its display name is
 * "PaidPrimeBot", which is not the same thing as @PaidPrimeBot and does
 * not resolve as a t.me link. Telegram passes the code through to the
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

  return { url: `https://t.me/DivPulseWelson_bot?start=${code}` };
}

export async function disconnectTelegram() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("telegram_links").delete().eq("user_id", user.id);

  revalidatePath("/settings");
  revalidatePath("/alert-templates");
}
