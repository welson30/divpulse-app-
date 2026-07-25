import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlaidClient } from "@/lib/plaid/client";
import { encrypt } from "@/lib/crypto/encryption";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

/**
 * Exchanges Plaid Link's public_token for a permanent access_token
 * (ARCHITECTURE.md §7 broker_connections), stores it encrypted, then
 * runs an immediate first sync so holdings appear right away instead of
 * the user waiting for the next scheduled sync.
 */
export async function POST(request: NextRequest) {
  const { publicToken, institutionName } = (await request.json()) as { publicToken?: string; institutionName?: string };

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

  const plaid = getPlaidClient();

  const exchangeResponse = await plaid.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  // broker_connections has no client-insert RLS policy by design (see
  // the migration) — writes go through the service-role client only, so
  // a compromised session token can't be used to plant a connection row
  // pointing at an attacker-controlled encrypted access token.
  const adminSupabase = createAdminClient();
  const { data: connection, error } = await adminSupabase
    .from("broker_connections")
    .insert({
      user_id: user.id,
      plaid_item_id: itemId,
      plaid_access_token: encrypt(accessToken),
      institution_name: institutionName ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: error?.message ?? "Couldn't save the connection." }, { status: 500 });
  }

  const syncResult = await syncHoldingsForConnection(connection.id);

  return NextResponse.json({ connected: true, holdingsSynced: syncResult.holdingsSynced });
}
