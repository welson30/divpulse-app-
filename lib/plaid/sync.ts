import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

type SyncResult = { holdingsSynced: number; error?: string };

/**
 * Fetches current holdings from Plaid's Investments endpoint for one
 * broker_connections row and upserts them into `holdings` with
 * source='plaid'. Called both right after Link (exchange-token route,
 * for an immediate first sync) and by the scheduled resync job.
 *
 * Plaid's /investments/holdings/get returns two parallel arrays —
 * `holdings` (security_id + quantity, one row per position) and
 * `securities` (security_id -> ticker_symbol/name) — joined here since
 * our holdings table wants ticker directly, not Plaid's internal ID.
 * Positions with no resolvable ticker (e.g. some cash/proprietary
 * instruments) are skipped rather than inserted with a null ticker.
 */
export async function syncHoldingsForConnection(connectionId: string): Promise<SyncResult> {
  const supabase = createAdminClient();

  const { data: connection } = await supabase
    .from("broker_connections")
    .select("id, user_id, plaid_access_token")
    .eq("id", connectionId)
    .single();

  if (!connection) {
    return { holdingsSynced: 0, error: "Connection not found." };
  }

  const plaid = getPlaidClient();
  const accessToken = decrypt(connection.plaid_access_token);

  try {
    const response = await plaid.investmentsHoldingsGet({ access_token: accessToken });
    const { holdings, securities } = response.data;

    const securityById = new Map(securities.map((s) => [s.security_id, s]));

    // Plaid's plaid_account_id here is the account, not a unique holding
    // identity — the same account can hold multiple tickers, so
    // upsert uniqueness for Plaid-sourced rows is (user_id, ticker,
    // plaid_account_id) conceptually, enforced by delete-then-insert
    // per connection below rather than a DB constraint (simpler than
    // reconciling partial-sell/full-sell diffs row by row).
    const rows = holdings
      .map((holding) => {
        const security = securityById.get(holding.security_id);
        const ticker = security?.ticker_symbol;
        if (!ticker || holding.quantity <= 0) return null;

        return {
          user_id: connection.user_id,
          ticker: ticker.toUpperCase(),
          company_name: security?.name ?? null,
          shares: holding.quantity,
          broker_name: null as string | null,
          source: "plaid" as const,
          plaid_account_id: holding.account_id,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    // Replace this connection's prior Plaid-sourced holdings wholesale —
    // simplest correct way to reflect sells/full-liquidations (a ticker
    // that disappeared from Plaid's response should disappear from ours
    // too), at the cost of a brief delete+insert window rather than a
    // true atomic diff.
    const accountIds = [...new Set(holdings.map((h) => h.account_id))];
    if (accountIds.length > 0) {
      await supabase
        .from("holdings")
        .delete()
        .eq("user_id", connection.user_id)
        .eq("source", "plaid")
        .in("plaid_account_id", accountIds);
    }

    if (rows.length > 0) {
      await supabase.from("holdings").insert(rows);
    }

    await supabase
      .from("broker_connections")
      .update({ status: "active", last_synced_at: new Date().toISOString() })
      .eq("id", connectionId);

    return { holdingsSynced: rows.length };
  } catch (err) {
    await supabase.from("broker_connections").update({ status: "error" }).eq("id", connectionId);
    return { holdingsSynced: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
