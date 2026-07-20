"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void>;
    OneSignal?: OneSignalSDK;
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

let initPromise: Promise<void> | null = null;

/**
 * Initializes OneSignal exactly once and returns a promise every caller
 * (this provider, the Enable-notifications button) can await — instead of
 * relying on OneSignal's OneSignalDeferred array draining itself, which
 * proved unreliable here: callbacks pushed after the SDK's one-time drain
 * (a real risk with Next's afterInteractive script strategy + React 19
 * effect timing) sit stranded forever with no error and no log. This
 * makes initialization idempotent and awaitable from anywhere.
 */
function getOneSignal(): Promise<OneSignalSDK> {
  if (!initPromise) {
    initPromise = new Promise<void>((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        console.log("[OneSignal] SDK ready, calling init()");
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });
        console.log("[OneSignal] init() resolved");
        resolve();
      });
    });
  }
  return initPromise.then(() => window.OneSignal!);
}

export function OneSignalProvider({ userId }: { userId: string }) {
  const loggedInUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loggedInUserId.current === userId) return;
    loggedInUserId.current = userId;

    getOneSignal()
      .then(async (OneSignal) => {
        await OneSignal.login(userId);
        console.log("[OneSignal] login() resolved for user", userId);
      })
      .catch((err) => console.error("[OneSignal] init/login failed", err));
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

export { getOneSignal };
