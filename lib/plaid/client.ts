import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let plaidClient: PlaidApi | null = null;

/** Single Plaid SDK instance, server-only — mirrors lib/stripe/client.ts's getStripe() pattern. */
export function getPlaidClient(): PlaidApi {
  if (plaidClient) return plaidClient;

  const env = process.env.PLAID_ENV ?? "sandbox";
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  return plaidClient;
}
