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
 */
export function OneSignalProvider({ userId }: { userId: string }) {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        // Only relevant for local dev — OneSignal requires HTTPS in
        // production, which Vercel provides automatically.
        allowLocalhostAsSecureOrigin: true,
      });
      await OneSignal.login(userId);
    });
  }, [userId]);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      defer
    />
  );
}
