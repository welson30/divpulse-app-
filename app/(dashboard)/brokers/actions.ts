"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { disconnectConnectionForUser } from "@/lib/plaid/disconnect";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

export type BrokerActionResult = { ok: true } | { error: string };

function revalidateBrokerPaths() {
  revalidatePath("/brokers");
  revalidatePath("/holdings");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/settings");
}

export async function resyncBrokerConnection(connectionId: string): Promise<BrokerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data: row } = await supabase
    .from("broker_connections")
    .select("id, status")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (!row || row.status === "disconnected") {
    return { error: "Connection not found." };
  }

  const result = await syncHoldingsForConnection(connectionId);
  revalidateBrokerPaths();
  if (result.error) return { error: result.error };
  return { ok: true };
}

/**
 * Finishes a Link update-mode session. Unlike a first connection there is
 * no public_token to exchange — Plaid keeps the same access_token through
 * update mode — so all that's left is clearing the reauth state and
 * pulling the data that was blocked while the login was expired.
 */
export async function completeBrokerReauth(connectionId: string): Promise<BrokerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data: row } = await supabase
    .from("broker_connections")
    .select("id")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (!row) return { error: "Connection not found." };

  // Cleared before syncing rather than after: if the resync itself fails
  // for an unrelated reason it sets its own error state, and leaving
  // needs_reauth set would send the user back through Link for a problem
  // Link can't fix.
  await createAdminClient()
    .from("broker_connections")
    .update({ needs_reauth: false, status: "active", last_error_code: null })
    .eq("id", connectionId);

  const result = await syncHoldingsForConnection(connectionId);
  revalidateBrokerPaths();
  if (result.error) return { error: result.error };
  return { ok: true };
}

export async function disconnectBrokerConnection(connectionId: string): Promise<BrokerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const result = await disconnectConnectionForUser(user.id, connectionId);
  revalidateBrokerPaths();
  return result;
}
