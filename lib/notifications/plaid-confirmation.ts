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

/** A dividend the user's broker actually reported, reduced to what we match on. */
type ConfirmedDividend = { ticker: string; amount: number };

export type BrokerDividendIndex = {
  /** True when the broker reported a dividend for this ticker at about this amount. */
  confirms: (ticker: string, amount: number) => boolean;
};

const NO_CONFIRMATIONS: BrokerDividendIndex = { confirms: () => false };

/**
 * Loads every dividend a user's linked brokers reported in the lookback
 * window, as an index the caller can query per payment.
 *
 * Built once per user rather than queried per payment. The previous shape
 * took (userId, ticker, amount) and ran a full paginated
 * /investments/transactions/get on every call — and the detection job calls
 * it inside a nested loop over events and holdings, so a user with twenty
 * dividend-paying positions produced twenty identical fetches per run,
 * against every connection. That is a rate-limit risk and, on a
 * Pay-As-You-Go plan, a directly billable one.
 *
 * Uses /investments/transactions/get, NOT /transactions/get. The
 * Transactions product does not cover investment-type accounts at all: on a
 * real brokerage Item, /transactions/get returns only the depository,
 * credit and loan accounts, and never sees a dividend. Verified against
 * Plaid's Sandbox — /transactions/get surfaced zero dividends on an Item
 * where /investments/transactions/get returned six.
 *
 * Matching goes through security_id -> securities[].ticker_symbol rather
 * than looking for the ticker in the transaction description. Real dividend
 * rows are named things like "INCOME DIV DIVIDEND RECEIVED" with no ticker
 * anywhere in the string, so a substring test could not match even on the
 * right endpoint.
 */
export async function loadBrokerDividends(userId: string): Promise<BrokerDividendIndex> {
  const supabase = createAdminClient();

  const { data: connections } = await supabase
    .from("broker_connections")
    .select("plaid_access_token")
    .eq("user_id", userId)
    .eq("status", "active");

  // The common case — no linked broker at all. Costs nothing and makes no
  // Plaid call.
  if (!connections || connections.length === 0) {
    return NO_CONFIRMATIONS;
  }

  const plaid = getPlaidClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - LOOKBACK_DAYS);

  const isoDate = (d: Date) => d.toISOString().slice(0, 10);
  const confirmed: ConfirmedDividend[] = [];

  for (const connection of connections) {
    try {
      const accessToken = decrypt(connection.plaid_access_token);
      let offset = 0;

      // Paginated because Plaid caps each response at PAGE_SIZE and reports
      // the real total separately. A few days of activity almost never fills
      // one page, but an account that reinvests daily across many positions
      // can, and silently reading only the first page would turn a real
      // confirmation into a false negative.
      for (;;) {
        const response = await plaid.investmentsTransactionsGet({
          access_token: accessToken,
          start_date: isoDate(startDate),
          end_date: isoDate(endDate),
          options: { count: PAGE_SIZE, offset },
        });

        const { investment_transactions: transactions, securities, total_investment_transactions: total } = response.data;
        const tickerBySecurityId = new Map(securities.map((s) => [s.security_id, s.ticker_symbol]));

        for (const transaction of transactions) {
          if (!transaction.subtype || !DIVIDEND_SUBTYPES.has(transaction.subtype)) continue;

          const ticker = transaction.security_id ? tickerBySecurityId.get(transaction.security_id) : null;
          if (!ticker) continue;

          // Plaid reports investment inflows as negative amounts, so the
          // sign carries direction rather than magnitude here.
          confirmed.push({ ticker: ticker.toUpperCase(), amount: Math.abs(transaction.amount) });
        }

        offset += transactions.length;
        if (transactions.length === 0 || offset >= total) break;
      }
    } catch {
      // A single connection's lookup failing (revoked consent, an Item
      // needing re-auth, an institution that doesn't expose investment
      // transactions) shouldn't block the user's other connections or fail
      // the whole notification send.
      continue;
    }
  }

  return {
    confirms(ticker, amount) {
      const wanted = ticker.toUpperCase();
      return confirmed.some((d) => d.ticker === wanted && Math.abs(d.amount - amount) < AMOUNT_TOLERANCE);
    },
  };
}
