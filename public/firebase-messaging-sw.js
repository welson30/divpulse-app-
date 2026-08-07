// Firebase Cloud Messaging service worker — required for background push
// (a tab that isn't focused, or the app not open at all). Must be a plain
// static file at the site root (public/ in Next.js, same lesson learned
// from the OneSignal worker file: files in the project root are never
// served over HTTP, only public/ is).
//
// Config values here are the public Firebase web config (safe to inline —
// not secrets, see lib/firebase/client.ts's comment). This file can't read
// process.env since it loads outside the Next.js build as a static asset.
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAMTq_T4q9FT7ssJsUrN1WON4s3HGXGIcg",
  authDomain: "paidprime-e823b.firebaseapp.com",
  projectId: "paidprime-e823b",
  storageBucket: "paidprime-e823b.firebasestorage.app",
  messagingSenderId: "168444830200",
  appId: "1:168444830200:web:204801b85b76ec3577b60d",
});

// Without these, a browser keeps the OLD service worker active for every
// tab that already has it registered, until all of them are fully closed
// — for a bookmarked/PWA-style app that can be days. The push payload
// just changed shape (data-only, no top-level `notification` field — see
// lib/firebase/admin.ts's sendPush), so anyone still running the old SW
// reads payload.notification?.title/body, both now undefined: one
// notification instead of two, but with a blank body and the generic
// "PaidPrime" title instead of the real content. skipWaiting +
// clients.claim make a newly-fetched SW take over on the very next
// registration check instead of waiting for every open tab to close,
// closing that window for this and any future SW change.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const messaging = firebase.messaging();

// Data-only payload (see lib/firebase/admin.ts's sendPush) — a
// `notification` field would make FCM auto-display this in addition to
// the showNotification() call below, doubling every push. The link lives
// in the notification's own `data` so the click handler can read it back.
messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title ?? "PaidPrime";
  const options = {
    body: payload.data?.body,
    icon: "/icons/manifest-192.png",
    data: { link: payload.data?.link },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/";
  event.waitUntil(self.clients.openWindow(link));
});
