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
  apiKey: "AIzaSyCFh9G-xH_13QMBn5UbNoOg30Qo4G-SkJM",
  authDomain: "paidprime-c38ee.firebaseapp.com",
  projectId: "paidprime-c38ee",
  storageBucket: "paidprime-c38ee.firebasestorage.app",
  messagingSenderId: "982683368705",
  appId: "1:982683368705:web:840306290c3a11121b6f00",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "PaidPrime";
  const options = {
    body: payload.notification?.body,
    icon: "/icons/manifest-192.png",
  };
  self.registration.showNotification(title, options);
});
