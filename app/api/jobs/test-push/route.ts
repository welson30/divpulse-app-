import { NextResponse, type NextRequest } from "next/server";
import { sendDividendPush } from "@/lib/onesignal/send-push";

/**
 * TEMPORARY — one-off manual test endpoint to verify OneSignal delivery
 * end-to-end without waiting for a real dividend to pay out today. Same
 * CRON_SECRET auth as the real detection job. Delete once push delivery
 * is confirmed working.
 *
 * Usage: GET /api/jobs/test-push?userId=<supabase-user-id>
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing ?userId=" }, { status: 400 });
  }

  const result = await sendDividendPush({ userId, ticker: "KO", amount: 46.2 });
  return NextResponse.json(result);
}
