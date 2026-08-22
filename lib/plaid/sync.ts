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

  try {
    // Inside the try, not above it. decrypt() throws on a corrupt payload or
    // a changed ENCRYPTION_KEY, and when that throw escaped this function it
    // took the caller with it — including the nightly cron, which iterates
    // every connection in one loop, so a single unreadable token stopped the
    // resync for every other user on the platform.
    const accessToken = decrypt(connection.plaid_access_token);

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

    // Identify what this sync replaces, before writing anything.
    //
    // Scoped by broker_connection_id, NOT by the account IDs in the current
    // response. The old account-ID scoping silently failed whenever those
    // IDs changed: a reconnect, or a second Item at the same institution,
    // deleted nothing and inserted a full duplicate set. Verified live on a
    // test account holding 9 positions as 18 rows, which inflated both the
    // portfolio total and the allocation chart.
    const staleIds = new Set<string>();

    const { data: owned, error: ownedError } = await supabase
      .from("holdings")
      .select("id")
      .eq("broker_connection_id", connection.id);
    if (ownedError) throw new Error(`Couldn't read existing holdings: ${ownedError.message}`);
    for (const row of owned ?? []) staleIds.add(row.id);

    // Transitional: rows synced before broker_connection_id existed carry
    // null, and the migration could only backfill users who had exactly one
    // connection. Match those on the old key so the first sync under the new
    // scheme replaces them instead of stacking on top. Can be deleted once
    // every connection has synced at least once.
    const accountIds = [...new Set(holdings.map((h) => h.account_id))];
    if (accountIds.length > 0) {
      const { data: legacy, error: legacyError } = await supabase
        .from("holdings")
        .select("id")
        .eq("user_id", connection.user_id)
        .eq("source", "plaid")
        .is("broker_connection_id", null)
        .in("plaid_account_id", accountIds);
      if (legacyError) throw new Error(`Couldn't read legacy holdings: ${legacyError.message}`);
      for (const row of legacy ?? []) staleIds.add(row.id);
    }

    // Insert BEFORE deleting, and check the result.
    //
    // The previous order deleted first, then inserted without inspecting the
    // outcome — and supabase-js reports failures in a returned `error`
    // rather than throwing, so a rejected insert was invisible. The row went
    // on to mark the connection "active" with a fresh last_synced_at and
    // report holdingsSynced: rows.length, meaning a wiped portfolio
    // presented as a clean sync. The reachable trigger is
    // holdings_enforce_plan_cap: a Pro+ user who downgrades to free still
    // has a live connection, so the next cron run would have emptied their
    // holdings. Inserting first means the worst case is stale data retained,
    // never data destroyed.
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("holdings").insert(rows);
      if (insertError) throw new Error(`Couldn't save holdings: ${insertError.message}`);
    }

    if (staleIds.size > 0) {
      const { error: deleteError } = await supabase.from("holdings").delete().in("id", [...staleIds]);
      // Deliberately not fatal: the new rows are already in, so the user
      // sees correct-plus-stale rather than missing data, and the next sync
      // recomputes staleIds and clears them. Failing the whole sync here
      // would report a problem the user cannot act on.
      if (deleteError) {
        console.error("[plaid/sync] stale holdings not removed", { connectionId, message: deleteError.message });
      }
    }

    const { error: statusError } = await supabase
      .from("broker_connections")
      .update({
        status: "active",
        needs_reauth: false,
        last_error_code: null,
        last_synced_at: new Date().toISOString(),
        unmatched_positions: unmatched,
      })
      .eq("id", connectionId);
    if (statusError) throw new Error(`Couldn't update connection status: ${statusError.message}`);

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
