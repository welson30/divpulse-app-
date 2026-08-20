import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

/**
 * Revokes a Plaid Item, marks the connection disconnected, and removes the
 * holdings that came from it. Writes go through the service-role client —
 * broker_connections has no client update/delete RLS (see
 * supabase/migrations/20260729000000_broker_connections.sql).
 */
export async function disconnectConnectionForUser(
  userId: string,
  connectionId: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("broker_connections")
    .select("id, user_id, plaid_access_token, status")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .single();

  if (!connection) {
    return { error: "Connection not found." };
  }
  if (connection.status === "disconnected") {
    return { ok: true };
  }

  let accessToken: string | null = null;
  try {
    accessToken = decrypt(connection.plaid_access_token);
  } catch {
    accessToken = null;
  }

  if (accessToken) {
    try {
      await getPlaidClient().itemRemove({ access_token: accessToken });
    } catch {
      // Already removed on Plaid's side, or the Item is in a state that
      // refuses the call — either way we still mark ourselves
      // disconnected, since leaving a connection the user asked to remove
      // sitting there "active" is worse than a stale Item at Plaid.
    }
  }

  // Deleting by connection replaces what used to be a two-branch guess:
  // fetch the Item's account IDs and delete those, or — if that fetch
  // failed, which is exactly what happens on a revoked or errored Item —
  // fall back to deleting every Plaid holding for the user, but only if
  // no other connection existed. That fallback meant disconnecting a
  // broken broker while a second one was linked left its holdings behind
  // permanently, with nothing pointing at them.
  await admin.from("holdings").delete().eq("broker_connection_id", connectionId);

  // Transitional, mirroring lib/plaid/sync.ts: pre-migration rows carry a
  // null broker_connection_id. If this was the user's only live
  // connection, any orphaned Plaid rows belonged to it.
  const { count } = await admin
    .from("broker_connections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("id", connectionId)
    .neq("status", "disconnected");

  if (!count) {
    await admin
      .from("holdings")
      .delete()
      .eq("user_id", userId)
      .eq("source", "plaid")
      .is("broker_connection_id", null);
  }

  await admin
    .from("broker_connections")
    .update({ status: "disconnected", needs_reauth: false, last_error_code: null })
    .eq("id", connectionId);

  return { ok: true };
}
