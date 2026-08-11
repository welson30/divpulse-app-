"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Upserts the signed-in user's FCM token — called right after
 * lib/firebase/client.ts's requestPushToken() resolves with a real token.
 * unique(fcm_token) on the table (20260723000000_push_subscriptions.sql)
 * means re-registering the same browser just refreshes updated_at rather
 * than creating a duplicate row.
 */
export async function savePushToken(fcmToken: string, userAgent: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, fcm_token: fcmToken, user_agent: userAgent }, { onConflict: "fcm_token" });

  if (error) {
    return { error: error.message };
  }

  return null;
}

/**
 * Advances the bell dropdown's read cursor to now. Deliberately not
 * followed by revalidatePath: the caller (NotificationBell) clears its own
 * unread badge optimistically the instant the dropdown opens, and this
 * runs from every page in (dashboard) via the shared layout — there's no
 * single route to revalidate, and forcing one would refresh whatever page
 * the user happens to be looking at just because they opened a dropdown.
 * The persisted timestamp only needs to be correct by the next full
 * navigation, which re-runs the layout's queries anyway.
 */
export async function markNotificationsSeen(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_last_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return null;
}

/** Same cursor write as the bell, then refresh the inbox so unread dots clear. */
export async function markAllNotificationsRead(): Promise<{ error: string } | null> {
  const result = await markNotificationsSeen();
  if (result) return result;
  revalidatePath("/notifications");
  return null;
}
