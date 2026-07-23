import "server-only";

const API_BASE = "https://api.telegram.org";

type SendMessageResult = { sent: boolean; error?: string; chatInvalid?: boolean };

/**
 * Direct call to Telegram's Bot API — no relay/dashboard layer, same
 * "own the send path" approach as lib/firebase/admin.ts after OneSignal.
 *
 * Returns { sent: false, chatInvalid: true } when Telegram reports the
 * chat as blocked/deleted (error_code 403, or 400 "chat not found"), so
 * the caller can clear telegram_links.chat_id — the user blocked the bot
 * or deleted their account, and re-sending will just fail again.
 */
export async function sendTelegramMessage(chatId: number, text: string): Promise<SendMessageResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { sent: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const response = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (response.ok) {
    return { sent: true };
  }

  const body = await response.json().catch(() => null);
  const description = body?.description ?? response.statusText;
  const chatInvalid = response.status === 403 || (response.status === 400 && /chat not found/i.test(description ?? ""));

  return { sent: false, error: description, chatInvalid };
}

/** Ticker + signed dollar amount + broker, the copy format the client supplied. */
export async function sendTelegramDividendAlert(
  chatId: number,
  ticker: string,
  amount: number,
  brokerName: string | null,
): Promise<SendMessageResult> {
  const broker = brokerName?.trim() || "Unspecified broker";
  const text = `Dividend received · ${ticker}\n+$${amount.toFixed(2)}\n${broker} · Payment confirmed ✓`;
  return sendTelegramMessage(chatId, text);
}
