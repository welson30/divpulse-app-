import "server-only";

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

type SendDividendPushParams = {
  userId: string; // Supabase auth user id — matches the OneSignal external ID set via OneSignal.login() client-side
  ticker: string;
  amount: number;
};

/**
 * Sends a push via OneSignal's REST API, targeted at a user by external
 * ID (the Supabase user id — see components/onesignal/onesignal-provider.tsx's
 * OneSignal.login() call, which is what makes this targeting work without
 * us tracking OneSignal's own player/subscription IDs ourselves).
 *
 * Copy format is the one documented in docs/services.md §3:
 * "Dividend received · JEPI · +$61.20".
 *
 * Returns { sent: boolean } rather than throwing on OneSignal-side
 * failures (e.g. the user never enabled notifications, so OneSignal has
 * no subscription to target) — the detection job's own dividend_payments
 * row is the source of truth and must not be rolled back just because a
 * push couldn't be delivered.
 */
export async function sendDividendPush({ userId, ticker, amount }: SendDividendPushParams): Promise<{ sent: boolean; error?: string }> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return { sent: false, error: "OneSignal not configured" };
  }

  const formattedAmount = amount.toFixed(2);

  const response = await fetch(ONESIGNAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      headings: { en: "Dividend received" },
      contents: { en: `${ticker} · +$${formattedAmount}` },
      data: { ticker, amount: formattedAmount, type: "dividend_payment" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: `OneSignal ${response.status}: ${body}` };
  }

  const result = (await response.json()) as { recipients?: number };
  return { sent: (result.recipients ?? 0) > 0 };
}
