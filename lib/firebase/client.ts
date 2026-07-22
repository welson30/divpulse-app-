"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";

// Public config — safe to expose (these are identifiers, not secrets;
// Firebase's real security boundary is server-side rules/service-account
// scoping). Mirrors the values in Firebase Console → Project settings →
// General → Your apps.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Requests notification permission, registers public/firebase-messaging-sw.js,
 * and returns a device FCM token — or null if the browser doesn't support
 * push (Safari on older versions, some in-app browsers) or the user
 * declines. Caller is responsible for persisting the token
 * (components/notifications/enable-notifications-button.tsx does this via
 * a server action into push_subscriptions).
 */
export async function requestPushToken(): Promise<string | null> {
  if (!(await isSupported())) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(getFirebaseApp());

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    serviceWorkerRegistration: registration,
  });

  return token || null;
}

/** True once a real FCM token exists for this browser — the ground-truth check, not just Notification.permission. */
export async function getExistingPushToken(): Promise<string | null> {
  if (!(await isSupported())) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!registration) return null;

    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}

/** Foreground message listener — fires when a push arrives while the tab is open and focused. */
export async function onForegroundPush(handler: (payload: { title?: string; body?: string }) => void) {
  if (!(await isSupported())) return () => {};

  const messaging: Messaging = getMessaging(getFirebaseApp());
  const unsubscribe = onMessage(messaging, (payload) => {
    handler({ title: payload.notification?.title, body: payload.notification?.body });
  });
  return unsubscribe;
}
