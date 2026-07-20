"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconAlerts, IconCheck } from "@/components/marketing/icons";
import { getOneSignal } from "@/components/onesignal/onesignal-provider";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function EnableNotificationsButton() {
  const [state, setState] = useState<PermissionState>("default");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as PermissionState);
  }, []);

  if (state === "unsupported" || state === "denied") {
    return null;
  }

  if (state === "granted") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-green-500">
        <IconCheck className="size-3.5" />
        Notifications on
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        className="h-9 gap-1.5 text-[13px]"
        onClick={async () => {
          setBusy(true);
          setBlocked(false);
          try {
            const OneSignal = await getOneSignal();
            await OneSignal.Notifications.requestPermission();
          } catch (err) {
            // The onesignal-timeout case (getOneSignal() timed out) is
            // what an ad blocker / privacy extension blocking
            // cdn.onesignal.com or its sync endpoint looks like from the
            // page's perspective — no JS error, just a hung request, so
            // this is the one failure mode worth naming specifically to
            // the user rather than a generic "something went wrong".
            setBlocked(true);
            console.error("[EnableNotifications] failed to request permission", err);
          } finally {
            setBusy(false);
            setState(Notification.permission as PermissionState);
          }
        }}
      >
        <IconAlerts className="size-4" />
        {busy ? "Enabling…" : "Enable notifications"}
      </Button>
      {blocked ? (
        <p className="max-w-[220px] text-right text-xs text-warning">
          Couldn&rsquo;t reach the notification service. If you have an ad blocker or privacy extension, allow
          onesignal.com and try again.
        </p>
      ) : null}
    </div>
  );
}
