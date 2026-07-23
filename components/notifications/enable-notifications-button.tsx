"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IconAlerts, IconCheck } from "@/components/marketing/icons";
import { requestPushToken, getExistingPushToken } from "@/lib/firebase/client";
import { savePushToken } from "@/app/(dashboard)/notifications/actions";

type ButtonState = "checking" | "idle" | "enabling" | "subscribed" | "denied" | "unsupported";

export function EnableNotificationsButton() {
  const [state, setState] = useState<ButtonState>("checking");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // On mount, check for a REAL existing FCM token — not just
  // Notification.permission — since a token can be revoked/expired
  // independently of the browser's stored permission choice. A token
  // existing client-side doesn't prove the server has it on file (e.g. a
  // prior savePushToken() call failed, or the token predates a Firebase
  // project change) — re-saving it here makes "Notifications on" mean
  // "the server actually has this token," not just "the browser does,"
  // and self-heals any past save that silently didn't land.
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
    getExistingPushToken()
      .then(async (token) => {
        if (cancelled) return;
        if (!token) {
          setState("idle");
          return;
        }
        await savePushToken(token, navigator.userAgent);
        if (!cancelled) setState("subscribed");
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
            // requestPushToken() only resolves with a non-null value once
            // FCM has actually issued a registration token — unlike our
            // earlier OneSignal integration, there's no separate
            // "permission granted but server-side subscription still
            // pending/failed" state to reconcile: a real token IS the
            // confirmation.
            const token = await requestPushToken();
            if (!token) {
              setErrorDialogOpen(true);
              setState("idle");
              return;
            }

            const result = await savePushToken(token, navigator.userAgent);
            if (result?.error) {
              setErrorDialogOpen(true);
              setState("idle");
              return;
            }

            setState("subscribed");
          } catch (err) {
            setErrorDialogOpen(true);
            console.error("[EnableNotifications] failed to enable notifications", err);
            setState("idle");
          }
        }}
      >
        <IconAlerts className="size-4" />
        {state === "enabling" ? "Enabling…" : "Enable notifications"}
      </Button>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Couldn&rsquo;t enable notifications</DialogTitle>
            <DialogDescription>
              Something blocked the request — an ad blocker or privacy extension can interfere with push
              notifications. Try allowing this site, then try again.
            </DialogDescription>
          </DialogHeader>
          <Button type="button" className="h-10 w-full" onClick={() => setErrorDialogOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
