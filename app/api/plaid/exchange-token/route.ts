import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { plaidErrorResponse } from "@/lib/plaid/errors";
import { encrypt } from "@/lib/crypto/encryption";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

/**
 * Exchanges Plaid Link's public_token for a permanent access_token
 * (ARCHITECTURE.md §7 broker_connections), stores it encrypted, then
 * runs an immediate first sync so holdings appear right away instead of
 * the user waiting for the next scheduled sync.
 */
export async function POST(request: NextRequest) {
  const { publicToken, institutionName, institutionId } = (await request.json()) as {
    publicToken?: string;
    institutionName?: string;
    institutionId?: string;
  };

  if (!publicToken) {
    return NextResponse.json({ error: "Missing public token." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "pro_plus") {
    return NextResponse.json({ error: "Broker auto-sync is a Pro+ feature." }, { status: 403 });
  }

  // broker_connections has no client-insert RLS policy by design (see the
  // migration) — every write here goes through the service-role client.
  const adminSupabase = createAdminClient();

  // Plaid mints a fresh item_id for every Link session, so the unique
  // constraint on plaid_item_id can't catch a user connecting the same bank
  // twice — which is easy to do after a failed-looking attempt. Both Items
  // then sync the same positions, doubling the portfolio and the dividend
  // income derived from it. Guarded on institution instead.
  if (institutionId) {
    const { data: duplicate } = await adminSupabase
      .from("broker_connections")
      .select("id, institution_name")
      .eq("user_id", user.id)
      .eq("plaid_institution_id", institutionId)
      .neq("status", "disconnected")
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          error: `${duplicate.institution_name ?? "That broker"} is already connected. Use Sync now to refresh it, or disconnect it first to reconnect.`,
        },
        { status: 409 },
      );
    }
  }

  const plaid = getPlaidClient();

  let accessToken: string;
  let itemId: string;
  try {
    const exchangeResponse = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    accessToken = exchangeResponse.data.access_token;
    itemId = exchangeResponse.data.item_id;
  } catch (err) {
    // Previously uncaught, so an expired or already-used public_token
    // produced a bare 500 with an empty body — the same undiagnosable
    // failure the link-token route used to have.
    return plaidErrorResponse(err, "exchange-token");
  }

  // Writes go through the service-role client only, so a compromised
  // session token can't be used to plant a connection row pointing at an
  // attacker-controlled encrypted access token.
  const { data: connection, error } = await adminSupabase
    .from("broker_connections")
    .insert({
      user_id: user.id,
      plaid_item_id: itemId,
      plaid_access_token: encrypt(accessToken),
      institution_name: institutionName ?? null,
      // Link hands us the institution_id exactly once, here. Update mode
      // and any per-institution handling key off the ID rather than the
      // display name, and there is no way to recover it later without
      // another round-trip.
      plaid_institution_id: institutionId ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: error?.message ?? "Couldn't save the connection." }, { status: 500 });
  }

  const syncResult = await syncHoldingsForConnection(connection.id);

  // The connection is real either way — the Item exists at Plaid and the
  // token is stored — so this stays a 200 and the caller keeps its success
  // path. But the sync error is no longer swallowed: it used to return
  // connected: true unconditionally, so a connection that landed straight
  // in status='error' looked like a clean success and the user had no idea
  // why no holdings appeared.
  return NextResponse.json({
    connected: true,
    holdingsSynced: syncResult.holdingsSynced,
    ...(syncResult.error ? { syncError: syncResult.error } : {}),
  });
}
