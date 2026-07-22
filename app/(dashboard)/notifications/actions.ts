"use server";

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
