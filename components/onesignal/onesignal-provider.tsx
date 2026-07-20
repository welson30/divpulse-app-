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

// A single init() call is queued into OneSignalDeferred exactly once and
// never retried — OneSignal itself throws "SDK already initialized" on a
// second init() call, and that queued callback keeps running in the
// background even after our own timeout gives up on it (there's no way
// to cancel it). Resetting this promise on timeout and letting a later
// caller re-queue a second init() is what caused
// "SDK already initialized": the first (slow) init() eventually
// succeeded in the background while a second one was already queued.
// So: exactly one queued attempt, ever, whether it resolves fast, slow,
// or never — callers race it against their own timeout instead.
let queuedInit: Promise<OneSignalSDK> | null = null;

function queueInitOnce(): Promise<OneSignalSDK> {
  if (!queuedInit) {
    queuedInit = new Promise<OneSignalSDK>((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
          });
          resolve(OneSignal);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
  return queuedInit;
}

/**
 * Returns a promise that resolves with the initialized OneSignal SDK, or
 * rejects after INIT_TIMEOUT_MS if it hasn't resolved yet — this timeout
 * is per-call, not shared: if one caller times out, the single underlying
 * queueInitOnce() attempt keeps running, and a later caller here can
 * still pick up its eventual success instead of triggering a duplicate
 * init() (see queueInitOnce's comment for why a duplicate is a real error
 * with this SDK, not just wasted work).
 */
function getOneSignal(): Promise<OneSignalSDK> {
  const init = queueInitOnce();
  const timeout = new Promise<OneSignalSDK>((_, reject) => {
    setTimeout(() => reject(new Error("onesignal-timeout")), INIT_TIMEOUT_MS);
  });
  return Promise.race([init, timeout]);
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
