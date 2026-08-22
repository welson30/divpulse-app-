import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

/**
 * Connections are synced one at a time, and each can spend up to ten
 * seconds retrying PRODUCT_NOT_READY, so this outgrows the platform default
 * as soon as there are a handful of users. Matches detect-dividends.
 */
export const maxDuration = 60;

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
    // Each connection is isolated. syncHoldingsForConnection returns its
    // errors rather than throwing, but this loop must survive an unexpected
    // throw too — one user's broken connection previously aborted the whole
    // run, silently stopping the resync for everyone after it in the list.
    try {
      const result = await syncHoldingsForConnection(connection.id);
      if (result.error) {
        errors.push({ connectionId: connection.id, error: result.error });
      } else {
        synced += 1;
      }
    } catch (err) {
      errors.push({ connectionId: connection.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ connectionsChecked: connections?.length ?? 0, connectionsSynced: synced, errors });
}
