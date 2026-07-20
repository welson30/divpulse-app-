"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void>;
  }
}

// Minimal surface of OneSignal's Web SDK v16 we actually use — not the
// full type surface, just what login()/requestPermission() need.
type OneSignalSDK = {
  init: (options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
    permission: boolean;
  };
};

/**
 * Loads the OneSignal Web SDK (official OneSignalDeferred pattern, not a
 * wrapper package — see PRD.md/services.md for the OneSignal choice) and
 * logs the signed-in Supabase user in as OneSignal's "external ID", so a
 * push can be targeted at a specific user via the REST API later
 * (lib/onesignal/send-push.ts) without needing to track OneSignal's own
 * player/subscription ID ourselves.
 *
 * TEMP: verbose console logging while diagnosing a silent-failure bug —
 * remove once push is confirmed working end-to-end.
 */
export function OneSignalProvider({ userId }: { userId: string }) {
  useEffect(() => {
    console.log("[OneSignal] provider mounted, queuing init for user", userId);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      console.log("[OneSignal] deferred callback firing — SDK object received", OneSignal);
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });
        console.log("[OneSignal] init() resolved successfully");
      } catch (err) {
        console.error("[OneSignal] init() threw", err);
        return;
      }
      try {
        await OneSignal.login(userId);
        console.log("[OneSignal] login() resolved successfully for user", userId);
      } catch (err) {
        console.error("[OneSignal] login() threw", err);
      }
    });
  }, [userId]);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      defer
      onLoad={() => console.log("[OneSignal] SDK script tag onLoad fired")}
      onError={(e) => console.error("[OneSignal] SDK script tag onError fired", e)}
    />
  );
}
