"use client";

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

const READY_TIMEOUT_MS = 8000;

// The actual init() call now lives in app/layout.tsx's <head> — OneSignal's
// own documented snippet, loaded on every page rather than injected later
// via next/script. OneSignal drains OneSignalDeferred exactly once; a
// second init() call throws "SDK already initialized" (a real error we
// hit during development — see git history), so this file must NOT queue
// its own init and must only ever push ONE callback here, used to signal
// "the SDK object is ready" to every caller of getOneSignal() below.
let readyPromise: Promise<OneSignalSDK> | null = null;

function waitForReady(): Promise<OneSignalSDK> {
  if (!readyPromise) {
    readyPromise = new Promise<OneSignalSDK>((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push((OneSignal) => {
        resolve(OneSignal);
      });
    });
  }
  return readyPromise;
}

/**
 * Resolves once OneSignal has finished the init() queued in
 * app/layout.tsx's <head>, or rejects after READY_TIMEOUT_MS. The timeout
 * is per-call — if the underlying waitForReady() promise is still slow
 * (e.g. a flaky network mid-registration), a later caller can still pick
 * up its eventual resolution instead of this file ever queuing a second,
 * conflicting init attempt.
 */
function getOneSignal(): Promise<OneSignalSDK> {
  const ready = waitForReady();
  const timeout = new Promise<OneSignalSDK>((_, reject) => {
    setTimeout(() => reject(new Error("onesignal-timeout")), READY_TIMEOUT_MS);
  });
  return Promise.race([ready, timeout]);
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

  return null;
}

export { getOneSignal };
