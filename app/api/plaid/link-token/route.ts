import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { createClient } from "@/lib/supabase/server";
import { getPlaidClient } from "@/lib/plaid/client";

/**
 * Creates a Plaid Link token — the first step of Plaid's Link flow
 * (ARCHITECTURE.md §9.2-equivalent: Pro+ broker auto-sync). The
 * frontend hands this token to react-plaid-link's usePlaidLink hook,
 * which opens Plaid's hosted connection UI.
 *
 * Investments + Transactions products. Investments powers the core
 * holdings sync (lib/plaid/sync.ts); Transactions is requested so the
 * "broker-confirmed payout" notification template
 * (lib/notifications/plaid-confirmation.ts) can check whether a detected
 * dividend actually shows up as a real deposit in the user's linked
 * account, not just that Yahoo Finance says the company paid one.
 * Balances is intentionally not requested — not used anywhere.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  // Plaid is Pro+ only (ARCHITECTURE.md §7) — checked server-side against
  // profiles.plan, never a client-visible flag, same reasoning as every
  // other plan gate in this app.
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "pro_plus") {
    return NextResponse.json({ error: "Broker auto-sync is a Pro+ feature. Upgrade in Settings to use it." }, { status: 403 });
  }

  const plaid = getPlaidClient();

  const response = await plaid.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "PaidPrime",
    products: [Products.Investments, Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return NextResponse.json({ linkToken: response.data.link_token });
}
