import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

// How many days of transaction history to scan for a matching deposit —
// generous enough to cover a same-day detection lag between Yahoo
// Finance's pay_date and Plaid's own transaction posting.
const LOOKBACK_DAYS = 3;

/**
 * Checks whether a user's linked Plaid account(s) show a transaction
 * matching a detected dividend — the "broker-confirmed payout"
 * notification template only sends when this returns true, so
 * "confirmed" is literally true rather than a copy variant with no real
 * verification behind it.
 *
 * Only meaningful for Pro+ users with an active broker_connections row
 * (Transactions product requested at Link time — see
 * app/api/plaid/link-token/route.ts). Matches loosely on ticker
 * appearing in the transaction name/merchant field and a same-magnitude
 * amount, since Plaid's investment transaction naming isn't standardized
 * across institutions — a strict amount match would miss real matches
 * over rounding differences.
 */
export async function findBrokerConfirmedDeposit(userId: string, ticker: string, amount: number): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: connections } = await supabase
    .from("broker_connections")
    .select("plaid_access_token")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!connections || connections.length === 0) {
    return false;
  }

  const plaid = getPlaidClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - LOOKBACK_DAYS);

  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  for (const connection of connections) {
    try {
      const accessToken = decrypt(connection.plaid_access_token);
      const response = await plaid.transactionsGet({
        access_token: accessToken,
        start_date: isoDate(startDate),
        end_date: isoDate(endDate),
      });

      const matched = response.data.transactions.some((transaction) => {
        const name = (transaction.name ?? "").toUpperCase();
        const mentionsTicker = name.includes(ticker.toUpperCase());
        const amountClose = Math.abs(Math.abs(transaction.amount) - amount) < 0.5;
        return mentionsTicker && amountClose;
      });

      if (matched) return true;
    } catch {
      // A single connection's lookup failing (revoked consent, sandbox
      // quirk, etc.) shouldn't block checking the user's other
      // connections or fail the whole notification send.
      continue;
    }
  }

  return false;
}
