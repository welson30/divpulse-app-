import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

/**
 * Periodic Plaid holdings resync — same CRON_SECRET auth pattern as
 * detect-dividends. Re-syncs every active broker_connections row so
 * Plaid-sourced holdings reflect real buys/sells without the user having
 * to reconnect. Intended to run daily (e.g. via the same Supabase
 * pg_cron setup used for dividend detection — see
 * supabase/migrations/20260727000000_pg_cron_dividend_detection.sql for
 * the pattern), not wired into a specific schedule here.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: connections } = await supabase.from("broker_connections").select("id").eq("status", "active");

  let synced = 0;
  const errors: { connectionId: string; error: string }[] = [];

  for (const connection of connections ?? []) {
    const result = await syncHoldingsForConnection(connection.id);
    if (result.error) {
      errors.push({ connectionId: connection.id, error: result.error });
    } else {
      synced += 1;
    }
  }

  return NextResponse.json({ connectionsChecked: connections?.length ?? 0, connectionsSynced: synced, errors });
}
