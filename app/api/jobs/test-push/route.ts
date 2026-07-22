import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDividendPush } from "@/lib/firebase/admin";

/**
 * TEMPORARY — one-off manual test endpoint to verify FCM delivery
 * end-to-end without waiting for a real dividend to pay out today. Same
 * CRON_SECRET auth as the real detection job. Delete once push delivery
 * is confirmed working long-term.
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

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, fcm_token")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: false, error: "No push subscriptions found for this user" });
  }

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      const result = await sendDividendPush(subscription.fcm_token, "KO", 46.2);
      if (result.staleToken) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      }
      return { subscriptionId: subscription.id, ...result };
    }),
  );

  return NextResponse.json({ results });
}
