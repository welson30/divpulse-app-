import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPlaidWebhook } from "@/lib/plaid/webhook-verify";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";
import { sendPush } from "@/lib/firebase/admin";
import { sendTelegramMessage } from "@/lib/telegram/send";

type PlaidWebhook = {
  webhook_type?: string;
  webhook_code?: string;
  item_id?: string;
  error?: { error_code?: string } | null;
};

/**
 * Plaid webhook receiver.
 *
 * The integration ran without one for its whole life, which meant the
 * single most common real-world failure was invisible: bank logins expire
 * every few months and Plaid announces it with ITEM: ERROR /
 * ITEM_LOGIN_REQUIRED. With nothing listening, the connection just stopped
 * returning data, the nightly resync flipped it to status='error', and the
 * user saw a vague "Attention" badge with no way to fix it. Plaid's launch
 * checklist lists webhooks as required-or-strongly-recommended before
 * taking Investments to production for exactly this reason.
 *
 * Also picks up HOLDINGS: DEFAULT_UPDATE so holdings refresh when the
 * broker actually reports a change, instead of waiting for the next daily
 * cron run.
 *
 * URL is /api/plaid/webhook (matching /api/telegram/webhook) rather than
 * /api/webhooks/plaid — the Stripe one sits at the latter only because
 * that URL was already registered with Stripe.
 */
export async function POST(request: NextRequest) {
  // Raw text, not request.json() — the signature covers the exact bytes
  // sent, so re-serialising the parsed object would change the hash.
  const rawBody = await request.text();

  const verification = await verifyPlaidWebhook(rawBody, request.headers.get("plaid-verification"));
  if (!verification.valid) {
    return NextResponse.json({ error: verification.reason }, { status: 400 });
  }

  let payload: PlaidWebhook;
  try {
    payload = JSON.parse(rawBody) as PlaidWebhook;
  } catch {
    return NextResponse.json({ error: "Malformed webhook body" }, { status: 400 });
  }

  const { webhook_type: type, webhook_code: code, item_id: itemId } = payload;
  if (!itemId) {
    return NextResponse.json({ received: true, ignored: "no item_id" });
  }

  const supabase = createAdminClient();
  const { data: connection } = await supabase
    .from("broker_connections")
    .select("id, user_id, institution_name, needs_reauth, status")
    .eq("plaid_item_id", itemId)
    .maybeSingle();

  // An Item we don't recognise (removed on our side, or belonging to
  // another environment) is not an error worth retrying.
  if (!connection) {
    return NextResponse.json({ received: true, ignored: "unknown item" });
  }

  if (type === "ITEM") {
    switch (code) {
      // Every one of these means the user has to go back through Link in
      // update mode before data will flow again.
      case "ERROR":
      case "PENDING_EXPIRATION":
      case "PENDING_DISCONNECT":
      case "USER_PERMISSION_REVOKED":
      case "USER_ACCOUNT_REVOKED": {
        const errorCode = payload.error?.error_code ?? code;

        await supabase
          .from("broker_connections")
          .update({ needs_reauth: true, status: "error", last_error_code: errorCode })
          .eq("id", connection.id);

        // Only on the false -> true transition. Plaid re-delivers webhooks
        // and fires ERROR again on every subsequent failed refresh, so
        // alerting unconditionally would notify the same user daily about
        // a connection they already know is broken.
        if (!connection.needs_reauth) {
          await alertReauthNeeded(supabase, connection.user_id, connection.institution_name);
        }
        break;
      }

      // Plaid resolved the login itself (typically the user fixed the same
      // Item through another app).
      case "LOGIN_REPAIRED": {
        await supabase
          .from("broker_connections")
          .update({ needs_reauth: false, status: "active", last_error_code: null })
          .eq("id", connection.id);
        break;
      }

      default:
        break;
    }
  }

  if (type === "HOLDINGS" && code === "DEFAULT_UPDATE") {
    await syncHoldingsForConnection(connection.id);
  }

  // Always 200 for anything that got this far — Plaid retries non-2xx
  // responses, and there is nothing to retry for an event we chose not to
  // act on.
  return NextResponse.json({ received: true });
}

/**
 * Tells the user their broker connection needs attention, over the
 * channels that already exist (there is no in-app notifications table).
 * Best-effort: a delivery failure must not fail the webhook, or Plaid will
 * retry and we'll re-run the whole handler.
 *
 * Not gated on plan the way dividend Telegram alerts are — reaching this
 * point requires a Plaid connection, which is already Pro+ only.
 */
async function alertReauthNeeded(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  institutionName: string | null,
) {
  const broker = institutionName?.trim() || "Your broker";
  const title = "Broker connection needs attention";
  const body = `${broker} needs you to sign in again before holdings can keep syncing.`;

  try {
    const { data: subscriptions } = await supabase.from("push_subscriptions").select("id, fcm_token").eq("user_id", userId);

    for (const subscription of subscriptions ?? []) {
      const result = await sendPush(subscription.fcm_token, title, body);
      if (result.staleToken) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }

    const { data: telegramLink } = await supabase
      .from("telegram_links")
      .select("chat_id")
      .eq("user_id", userId)
      .not("chat_id", "is", null)
      .maybeSingle();

    if (telegramLink?.chat_id) {
      const result = await sendTelegramMessage(telegramLink.chat_id, `⚠️ ${title}\n${body}\n\nReconnect from Brokers in PaidPrime.`);
      if (result.chatInvalid) {
        await supabase.from("telegram_links").update({ chat_id: null, linked_at: null }).eq("user_id", userId);
      }
    }
  } catch {
    // Swallowed deliberately — see the note above.
  }
}
