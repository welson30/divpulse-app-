import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let app: App | null = null;

function getFirebaseAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
  app = initializeApp({
    credential: cert(serviceAccount),
  });
  return app;
}

type SendPushResult = { sent: boolean; error?: string; staleToken?: boolean };

/**
 * Sends a push via Firebase Admin's messaging API — direct to Google's
 * FCM, no third-party dashboard/relay layer (see conversation history:
 * replaces OneSignal after its Web SDK couldn't complete a TLS handshake
 * to api.onesignal.com from Pakistani networks).
 *
 * Returns { sent: false, staleToken: true } on FCM's
 * "registration-token-not-registered" error so the caller can prune the
 * dead row from push_subscriptions (the token becomes invalid when a user
 * uninstalls, clears site data, or the token naturally rotates).
 */
export async function sendPush(fcmToken: string, title: string, body: string): Promise<SendPushResult> {
  try {
    await getMessaging(getFirebaseAdminApp()).send({
      token: fcmToken,
      notification: { title, body },
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.paidprime.com",
        },
      },
    });
    return { sent: true };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "messaging/registration-token-not-registered") {
      return { sent: false, error: "stale token", staleToken: true };
    }
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Ticker + signed dollar amount, the copy format from docs/services.md §3. */
export async function sendDividendPush(fcmToken: string, ticker: string, amount: number): Promise<SendPushResult> {
  return sendPush(fcmToken, "Dividend received", `${ticker} · +$${amount.toFixed(2)}`);
}
