"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta Pixel for paid-ads measurement (deal.sconnect portfolio, linked to
// CONTA ANÚNCIOS 02). The ID is public by design — it ships in every page
// that loads the pixel — so it lives in code with an env override.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1250053853267443";

type Fbq = (...args: unknown[]) => void;

function fbq(...args: unknown[]) {
  const w = window as unknown as { fbq?: Fbq };
  if (typeof w.fbq === "function") w.fbq(...args);
}

/**
 * Loads the pixel once and fires PageView on the first load and on every
 * client-side route change (the App Router doesn't reload the page).
 */
export function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The inline init script already sent the initial PageView.
    if (first.current) {
      first.current = false;
      return;
    }
    fbq("track", "PageView");
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

/**
 * Fires CompleteRegistration once for a brand-new account. On onboarding it
 * only fires when ?new=1 is present (added for accounts created seconds ago),
 * then strips the flag so a refresh can't re-fire it. `always` is for the
 * "check your email" page, which only email sign-ups ever reach.
 */
export function TrackRegistration({ always = false }: { always?: boolean }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!always && url.searchParams.get("new") !== "1") return;
    const send = () => fbq("track", "CompleteRegistration");
    // The pixel script may still be loading; it queues calls once defined.
    if (typeof (window as unknown as { fbq?: Fbq }).fbq === "function") send();
    else setTimeout(send, 1500);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [always]);
  return null;
}
