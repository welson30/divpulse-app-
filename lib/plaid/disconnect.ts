import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

/**
 * Revokes a Plaid Item, marks the connection disconnected, and removes
 * Plaid-sourced holdings that belonged to that Item. Writes go through
 * the service-role client — broker_connections has no client update/delete
 * RLS (see supabase/migrations/20260729000000_broker_connections.sql).
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

  const plaid = getPlaidClient();
  let accountIds: string[] = [];

  if (accessToken) {
    try {
      const holdingsResponse = await plaid.investmentsHoldingsGet({ access_token: accessToken });
      accountIds = [...new Set(holdingsResponse.data.holdings.map((h) => h.account_id))];
    } catch {
      // Item may already be revoked or the investments product unavailable.
    }
    try {
      await plaid.itemRemove({ access_token: accessToken });
    } catch {
      // Already removed on Plaid's side — still mark us disconnected.
    }
  }

  if (accountIds.length > 0) {
    await admin
      .from("holdings")
      .delete()
      .eq("user_id", userId)
      .eq("source", "plaid")
      .in("plaid_account_id", accountIds);
  } else {
    const { count } = await admin
      .from("broker_connections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("id", connectionId)
      .neq("status", "disconnected");
    if (!count) {
      await admin.from("holdings").delete().eq("user_id", userId).eq("source", "plaid");
    }
  }

  await admin.from("broker_connections").update({ status: "disconnected" }).eq("id", connectionId);
  return { ok: true };
}
