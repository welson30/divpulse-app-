import "server-only";
import type { Holding, Security } from "plaid";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

type SyncResult = { holdingsSynced: number; error?: string };

/**
 * Plaid returns PRODUCT_NOT_READY while it is still pulling an Item's
 * first batch of data, which is exactly the window the post-Link sync runs
 * in. Without a retry the very first sync after connecting could fail and
 * immediately mark a brand-new connection as errored — the user watches
 * Link succeed and then sees "Attention" on the broker they just added.
 */
const NOT_READY_RETRIES = 5;
const NOT_READY_DELAY_MS = 2000;

/** Plaid error codes that mean the user must re-authenticate via Link update mode. */
const REAUTH_ERROR_CODES = new Set([
  "ITEM_LOGIN_REQUIRED",
  "PENDING_EXPIRATION",
  "PENDING_DISCONNECT",
  "USER_PERMISSION_REVOKED",
  "USER_ACCOUNT_REVOKED",
]);

function plaidErrorCode(err: unknown): string | null {
  const data = (err as { response?: { data?: { error_code?: string } } })?.response?.data;
  return data?.error_code ?? null;
}

/**
 * Fetches current holdings from Plaid's Investments endpoint for one
 * broker_connections row and upserts them into `holdings` with
 * source='plaid'. Called after Link (exchange-token route, for an
 * immediate first sync), by the scheduled resync job, by the Sync now
 * button, and by the HOLDINGS: DEFAULT_UPDATE webhook.
 *
 * Plaid's /investments/holdings/get returns two parallel arrays —
 * `holdings` (security_id + quantity, one row per position) and
 * `securities` (security_id -> ticker_symbol/name) — joined here since
 * our holdings table wants ticker directly, not Plaid's internal ID.
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
    let holdings: Holding[] = [];
    let securities: Security[] = [];

    for (let attempt = 1; ; attempt += 1) {
      try {
        const response = await plaid.investmentsHoldingsGet({ access_token: accessToken });
        holdings = response.data.holdings;
        securities = response.data.securities;
        break;
      } catch (err) {
        if (plaidErrorCode(err) === "PRODUCT_NOT_READY" && attempt < NOT_READY_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, NOT_READY_DELAY_MS));
          continue;
        }
        throw err;
      }
    }

    const securityById = new Map(securities.map((s) => [s.security_id, s]));

    const rows: {
      user_id: string;
      broker_connection_id: string;
      ticker: string;
      company_name: string | null;
      shares: number;
      broker_name: string | null;
      source: "plaid";
      plaid_account_id: string;
    }[] = [];

    // Positions Plaid reports without a ticker_symbol — some mutual
    // funds, treasuries, and proprietary sweep vehicles. These used to be
    // dropped silently, which quietly under-reported the portfolio; a
    // dividend tracker losing a mutual fund position is the opposite of
    // the point. `holdings.ticker` is NOT NULL and every downstream
    // lookup (Yahoo dividends, prices, logos) is ticker-keyed, so they
    // still can't be stored as holdings — but they're recorded on the
    // connection so the Brokers page can name what didn't come across.
    const unmatched: { name: string; quantity: number; security_id: string }[] = [];

    for (const holding of holdings) {
      const security = securityById.get(holding.security_id);
      const ticker = security?.ticker_symbol;

      if (!ticker) {
        // Cash balances aren't positions and were never meant to sync;
        // listing them as "couldn't be matched" would be noise.
        if (!security?.is_cash_equivalent) {
          unmatched.push({
            name: security?.name ?? holding.security_id,
            quantity: holding.quantity,
            security_id: holding.security_id,
          });
        }
        continue;
      }

      if (holding.quantity <= 0) continue;

      rows.push({
        user_id: connection.user_id,
        broker_connection_id: connection.id,
        ticker: ticker.toUpperCase(),
        company_name: security?.name ?? null,
        shares: holding.quantity,
        broker_name: null,
        source: "plaid",
        plaid_account_id: holding.account_id,
      });
    }

    // Replace this connection's prior holdings wholesale — the simplest
    // correct way to reflect sells and full liquidations, since a ticker
    // that disappeared from Plaid's response should disappear from ours.
    //
    // Scoped by broker_connection_id, NOT by the account IDs in the
    // current response. The old account-ID scoping silently failed
    // whenever those IDs changed: a reconnect, or a second Item at the
    // same institution, deleted nothing and inserted a full duplicate
    // set. Verified live on a test account holding 9 positions as 18
    // rows, which inflated both the portfolio total and the allocation
    // chart.
    await supabase.from("holdings").delete().eq("broker_connection_id", connection.id);

    // Transitional: rows synced before broker_connection_id existed carry
    // null, and the migration could only backfill users who had exactly
    // one connection. Match those on the old key so the first sync under
    // the new scheme replaces them instead of stacking on top. Can be
    // deleted once every connection has synced at least once.
    const accountIds = [...new Set(holdings.map((h) => h.account_id))];
    if (accountIds.length > 0) {
      await supabase
        .from("holdings")
        .delete()
        .eq("user_id", connection.user_id)
        .eq("source", "plaid")
        .is("broker_connection_id", null)
        .in("plaid_account_id", accountIds);
    }

    if (rows.length > 0) {
      await supabase.from("holdings").insert(rows);
    }

    await supabase
      .from("broker_connections")
      .update({
        status: "active",
        needs_reauth: false,
        last_error_code: null,
        last_synced_at: new Date().toISOString(),
        unmatched_positions: unmatched,
      })
      .eq("id", connectionId);

    return { holdingsSynced: rows.length };
  } catch (err) {
    const errorCode = plaidErrorCode(err);

    // A cron run often notices an expired login before the webhook lands
    // (or instead of it, if webhook delivery failed), so the same reauth
    // state is set from here too.
    await supabase
      .from("broker_connections")
      .update({
        status: "error",
        last_error_code: errorCode,
        ...(errorCode && REAUTH_ERROR_CODES.has(errorCode) ? { needs_reauth: true } : {}),
      })
      .eq("id", connectionId);

    return { holdingsSynced: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
