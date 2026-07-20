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

const INIT_TIMEOUT_MS = 8000;

let initPromise: Promise<OneSignalSDK> | null = null;

/**
 * Initializes OneSignal exactly once and returns a promise every caller
 * (this provider, the Enable-notifications button) can await — instead of
 * relying on OneSignal's OneSignalDeferred array draining itself, which
 * proved unreliable: callbacks pushed after the SDK's one-time drain sit
 * stranded forever with no error and no log.
 *
 * Times out after INIT_TIMEOUT_MS and rejects, rather than hanging
 * silently forever — this is what makes ad-blocker interference (the SDK
 * script or its /sync/ endpoint getting blocked, which produces no JS
 * error, just a network request that never completes) surface as a real,
 * catchable failure instead of a dead button with no feedback.
 */
function getOneSignal(): Promise<OneSignalSDK> {
  if (!initPromise) {
    initPromise = new Promise<OneSignalSDK>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("onesignal-timeout"));
      }, INIT_TIMEOUT_MS);

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
          });
          clearTimeout(timer);
          resolve(OneSignal);
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      });
    }).catch((err) => {
      // Let the next caller retry (e.g. after the user disables a
      // blocker and clicks the button again) instead of caching a
      // permanent failure.
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export function OneSignalProvider({ userId }: { userId: string }) {
  const loggedInUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loggedInUserId.current === userId) return;
    loggedInUserId.current = userId;

    getOneSignal()
      .then((OneSignal) => OneSignal.login(userId))
      .catch(() => {
        // Silent here — the Enable-notifications button surfaces the
        // actual failure/timeout to the user when they try to act on it.
        // A background init failure on page load shouldn't interrupt
        // anyone who isn't trying to enable notifications right now.
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

export { getOneSignal };
