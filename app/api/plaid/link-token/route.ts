import { NextResponse, type NextRequest } from "next/server";
import { CountryCode, Products, type LinkTokenCreateRequest } from "plaid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { plaidErrorResponse } from "@/lib/plaid/errors";
import { decrypt } from "@/lib/crypto/encryption";

/**
 * Optional Plaid Link settings, both deliberately env-gated.
 *
 * redirect_uri is not merely unused when absent from the dashboard — Plaid
 * rejects /link/token/create outright with INVALID_FIELD ("OAuth redirect
 * URI must be configured in the developer dashboard"), verified live. So
 * hardcoding one would take the entire connect flow down until someone
 * remembered to allow-list it. Setting PLAID_REDIRECT_URI is therefore the
 * second half of a two-step change: add the URI in the Plaid dashboard
 * first, then set the variable.
 *
 * Without it, OAuth institutions still work on desktop via a pop-up, but
 * mobile web and in-app browsers block pop-ups and have no fallback — and
 * every major US brokerage is OAuth (Fidelity, Schwab, Robinhood,
 * Vanguard, Merrill all report oauth=true), so this matters for exactly
 * the institutions this product exists to serve.
 *
 * webhook has no such dashboard requirement and is accepted as-is, but is
 * still gated so local development doesn't register an unreachable URL.
 */
function optionalLinkSettings(): Pick<LinkTokenCreateRequest, "webhook" | "redirect_uri"> {
  const settings: Pick<LinkTokenCreateRequest, "webhook" | "redirect_uri"> = {};

  const webhook = process.env.PLAID_WEBHOOK_URL?.trim();
  if (webhook) settings.webhook = webhook;

  const redirectUri = process.env.PLAID_REDIRECT_URI?.trim();
  if (redirectUri) settings.redirect_uri = redirectUri;

  return settings;
}

/**
 * Creates a Plaid Link token — the first step of Plaid's Link flow
 * (ARCHITECTURE.md §9.2-equivalent: Pro+ broker auto-sync). The
 * frontend hands this token to react-plaid-link's usePlaidLink hook,
 * which opens Plaid's hosted connection UI.
 *
 * Investments only. Transactions used to be requested alongside it for the
 * "broker-confirmed payout" notification (lib/notifications/plaid-
 * confirmation.ts), but that was a misreading of Plaid's model: the
 * Transactions product does not cover investment accounts, and dividends
 * come from /investments/transactions/get, which is part of Investments.
 * Transactions is separately billed, so requesting it was paying for a
 * product the app could never have used. Dropping it costs no institution
 * coverage — measured at 3,184 US institutions either way.
 *
 * POSTing { connectionId } instead returns an update-mode token, used to
 * re-authenticate an existing Item whose login expired rather than create
 * a new one.
 */
export async function POST(request: NextRequest) {
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

  // Body is optional — the plain "connect a new broker" call sends none.
  const body = (await request.json().catch(() => ({}))) as { connectionId?: string };

  const plaid = getPlaidClient();

  if (body.connectionId) {
    // Update mode. Ownership is checked here rather than trusting the id
    // from the client, since it selects which Item's credentials get
    // re-opened in Link.
    const { data: connection } = await createAdminClient()
      .from("broker_connections")
      .select("plaid_access_token")
      .eq("id", body.connectionId)
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json({ error: "Connection not found." }, { status: 404 });
    }

    let accessToken: string;
    try {
      accessToken = decrypt(connection.plaid_access_token);
    } catch {
      return NextResponse.json(
        { error: "This connection's stored credentials are unreadable. Disconnect it and connect again." },
        { status: 500 },
      );
    }

    // No `products` array in update mode — per Plaid's contract, passing
    // one here is only for adding credit products, and would be rejected.
    // The access_token is unchanged by the flow, so nothing needs
    // exchanging afterwards.
    try {
      const response = await plaid.linkTokenCreate({
        user: { client_user_id: user.id },
        client_name: "PaidPrime",
        country_codes: [CountryCode.Us],
        language: "en",
        access_token: accessToken,
        // Reopens Plaid's Account Select. Reconnect is also the recovery
        // path for a user who shared no investment accounts the first time
        // — without this, update mode only re-authenticates and they would
        // have to disconnect and start over to fix the account choice.
        //
        // Plaid ignores the flag for OAuth institutions that run their own
        // account selection (most US brokerages), where Account Select is
        // always shown in update mode regardless; it is the non-OAuth case
        // this actually changes.
        update: { account_selection_enabled: true },
        ...optionalLinkSettings(),
      });
      return NextResponse.json({ linkToken: response.data.link_token, mode: "update" });
    } catch (err) {
      return plaidErrorResponse(err, "update mode");
    }
  }

  let response;
  try {
    response = await plaid.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "PaidPrime",
      products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: "en",
      ...optionalLinkSettings(),
    });
  } catch (err) {
    return plaidErrorResponse(err, "create mode");
  }

  return NextResponse.json({ linkToken: response.data.link_token, mode: "create" });
}
