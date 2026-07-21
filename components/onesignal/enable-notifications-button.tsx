"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IconAlerts, IconCheck } from "@/components/marketing/icons";
import { getOneSignal, isReallySubscribed } from "@/components/onesignal/onesignal-provider";

type ButtonState = "idle" | "checking" | "enabling" | "subscribed" | "denied" | "unsupported";

const SUBSCRIPTION_CONFIRM_TIMEOUT_MS = 10000;

export function EnableNotificationsButton() {
  const [state, setState] = useState<ButtonState>("checking");
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);

  // On mount, check the REAL subscription state from OneSignal (not just
  // browser Notification.permission) — a user can have granted browser
  // permission on a prior visit while the server-side subscription create
  // never actually completed (see onesignal-provider.tsx's
  // isReallySubscribed doc comment), so permission alone is not proof.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    let cancelled = false;
    getOneSignal()
      .then((OneSignal) => {
        if (cancelled) return;
        setState(isReallySubscribed(OneSignal) ? "subscribed" : "idle");
      })
      .catch(() => {
        if (!cancelled) setState("idle");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "unsupported" || state === "denied") {
    return null;
  }

  if (state === "checking") {
    return null;
  }

  if (state === "subscribed") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-green-500">
        <IconCheck className="size-3.5" />
        Notifications on
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={state === "enabling"}
        className="h-9 gap-1.5 text-[13px]"
        onClick={async () => {
          setState("enabling");
          try {
            const OneSignal = await getOneSignal();
            await OneSignal.Notifications.requestPermission();

            // requestPermission() resolving only means the BROWSER granted
            // permission — it does not mean OneSignal's server actually
            // finished creating the subscription (that's a separate async
            // operation that can fail, e.g. the regional network issue
            // this app hit). Wait for the real confirmation via the
            // PushSubscription change listener, with a hard timeout so a
            // failed/hung server-side create doesn't leave the button
            // stuck on "Enabling…" forever.
            const confirmed = await new Promise<boolean>((resolve) => {
              if (isReallySubscribed(OneSignal)) {
                resolve(true);
                return;
              }
              const timer = setTimeout(() => {
                OneSignal.User.PushSubscription.removeEventListener("change", onChange);
                resolve(false);
              }, SUBSCRIPTION_CONFIRM_TIMEOUT_MS);
              function onChange() {
                if (isReallySubscribed(OneSignal)) {
                  clearTimeout(timer);
                  OneSignal.User.PushSubscription.removeEventListener("change", onChange);
                  resolve(true);
                }
              }
              OneSignal.User.PushSubscription.addEventListener("change", onChange);
            });

            if (confirmed) {
              setState("subscribed");
            } else {
              setBlockedDialogOpen(true);
              setState("idle");
            }
          } catch (err) {
            // getOneSignal() timing out or requestPermission() throwing —
            // what ad-blocker/privacy-extension interference (or the
            // regional network issue) looks like from here: no clean JS
            // error, just a hung or rejected call.
            setBlockedDialogOpen(true);
            console.error("[EnableNotifications] failed to enable notifications", err);
            setState("idle");
          }
        }}
      >
        <IconAlerts className="size-4" />
        {state === "enabling" ? "Enabling…" : "Enable notifications"}
      </Button>

      <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Couldn&rsquo;t confirm your subscription</DialogTitle>
            <DialogDescription>
              Your browser allowed notifications, but we couldn&rsquo;t confirm it with our notification service. An
              ad blocker or privacy extension may be interfering — allow onesignal.com for this site and try again.
            </DialogDescription>
          </DialogHeader>
          <Button type="button" className="h-10 w-full" onClick={() => setBlockedDialogOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
