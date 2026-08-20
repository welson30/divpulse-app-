import "server-only";
import { InvestmentTransactionSubtype } from "plaid";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { decrypt } from "@/lib/crypto/encryption";

/**
 * How many days back to scan for a matching dividend. Covers the gap
 * between Yahoo publishing a pay_date and the broker actually posting the
 * transaction, which for investment accounts runs longer than it does for
 * ordinary bank transactions — brokers often batch-post income a few days
 * after the payable date.
 */
const LOOKBACK_DAYS = 5;

/** Plaid's page size for /investments/transactions/get; also its maximum. */
const PAGE_SIZE = 500;

/**
 * Every subtype that means "this dividend was actually paid". Reinvestment
 * counts: the cash landed and was immediately used to buy more shares, so
 * from the user's point of view the payout happened.
 */
const DIVIDEND_SUBTYPES = new Set<string>([
  InvestmentTransactionSubtype.Dividend,
  InvestmentTransactionSubtype.QualifiedDividend,
  InvestmentTransactionSubtype.NonQualifiedDividend,
  InvestmentTransactionSubtype.DividendReinvestment,
]);

/**
 * Tolerance when comparing our computed amount to the broker's. Brokers
 * withhold tax, round per-lot, and occasionally split a payout across
 * accounts, so an exact match would reject real confirmations.
 */
const AMOUNT_TOLERANCE = 0.5;

/**
 * Checks whether a user's linked Plaid account(s) show a dividend matching
 * one we detected — the "broker-confirmed payout" notification template
 * only sends when this returns true, so "confirmed" is literally true
 * rather than a copy variant with no verification behind it.
 *
 * Uses /investments/transactions/get, NOT /transactions/get. The
 * Transactions product does not cover investment-type accounts at all: on
 * a real brokerage Item, /transactions/get returns only the depository,
 * credit and loan accounts, and never sees a dividend. Verified against
 * Plaid's Sandbox — /transactions/get surfaced zero dividends on an Item
 * where /investments/transactions/get returned six. This function
 * therefore never once returned true before that fix, and the Premium
 * notification style silently degraded to Descriptive for every user.
 *
 * Matching goes through security_id -> securities[].ticker_symbol rather
 * than looking for the ticker in the transaction description. Real
 * dividend rows are named things like "INCOME DIV DIVIDEND RECEIVED" with
 * no ticker anywhere in the string, so the old substring test could not
 * have matched even on the right endpoint. The security join is also what
 * Plaid intends: the transaction identifies its security by ID, and the
 * same response carries the securities needed to resolve it.
 *
 * Only meaningful for Pro+ users with an active broker_connections row.
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
  const wanted = ticker.toUpperCase();

  for (const connection of connections) {
    try {
      const accessToken = decrypt(connection.plaid_access_token);
      let offset = 0;

      // Paginated because Plaid caps each response at PAGE_SIZE and
      // reports the real total separately. A few days of activity almost
      // never fills one page, but an account that reinvests daily across
      // many positions can, and silently reading only the first page
      // would turn a real confirmation into a false negative.
      for (;;) {
        const response = await plaid.investmentsTransactionsGet({
          access_token: accessToken,
          start_date: isoDate(startDate),
          end_date: isoDate(endDate),
          options: { count: PAGE_SIZE, offset },
        });

        const { investment_transactions: transactions, securities, total_investment_transactions: total } = response.data;

        const tickerBySecurityId = new Map(securities.map((s) => [s.security_id, s.ticker_symbol]));

        const matched = transactions.some((transaction) => {
          if (!transaction.subtype || !DIVIDEND_SUBTYPES.has(transaction.subtype)) return false;

          const securityTicker = transaction.security_id ? tickerBySecurityId.get(transaction.security_id) : null;
          if (securityTicker?.toUpperCase() !== wanted) return false;

          // Plaid reports investment inflows as negative amounts, so the
          // sign carries direction rather than magnitude here.
          return Math.abs(Math.abs(transaction.amount) - amount) < AMOUNT_TOLERANCE;
        });

        if (matched) return true;

        offset += transactions.length;
        if (transactions.length === 0 || offset >= total) break;
      }
    } catch {
      // A single connection's lookup failing (revoked consent, an Item
      // needing re-auth, an institution that doesn't expose investment
      // transactions) shouldn't block checking the user's other
      // connections or fail the whole notification send.
      continue;
    }
  }

  return false;
}
