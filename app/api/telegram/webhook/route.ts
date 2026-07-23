import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id: number };
  };
};

/**
 * Telegram webhook — receives every update sent to @DivPulseWelson_bot
 * (its display name is "PaidPrimeBot", but that's not the @username).
 * Registered against this URL via Telegram's setWebhook API once a public
 * HTTPS URL exists (not usable from localhost — see conversation history,
 * verification deferred to post-deploy same as FCM push).
 *
 * Only handles `/start <code>` (the deep-link payload from
 * getTelegramLinkUrl in app/(dashboard)/settings/actions.ts). Anything
 * else is ignored — always 200, since Telegram retries non-2xx responses
 * and there's nothing to retry here.
 *
 * No shared-secret header check: Telegram's webhook protocol supports a
 * `secret_token` set at registration time (X-Telegram-Bot-Api-Secret-Token
 * header) — add that check once the webhook is actually registered, so
 * this route isn't a fully open chat_id-writing endpoint in the meantime.
 */
export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;

  if (!text?.startsWith("/start ") || !chatId) {
    return NextResponse.json({ ok: true });
  }

  const code = text.slice("/start ".length).trim();
  if (!code) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  await supabase
    .from("telegram_links")
    .update({ chat_id: chatId, linked_at: new Date().toISOString() })
    .eq("link_code", code)
    .is("chat_id", null);

  return NextResponse.json({ ok: true });
}
