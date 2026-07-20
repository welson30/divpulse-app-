"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconAlerts, IconCheck } from "@/components/marketing/icons";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

// TEMP: verbose console logging while diagnosing a silent-failure bug —
// remove once push is confirmed working end-to-end.
export function EnableNotificationsButton() {
  const [state, setState] = useState<PermissionState>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    console.log("[EnableNotifications] mounted, current permission:", Notification.permission);
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
    <Button
      type="button"
      variant="secondary"
      className="h-9 gap-1.5 text-[13px]"
      onClick={() => {
        console.log("[EnableNotifications] button clicked, OneSignalDeferred queue length before push:", window.OneSignalDeferred?.length ?? "undefined (not yet initialized)");
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal) => {
          console.log("[EnableNotifications] deferred callback firing, calling requestPermission()");
          try {
            await OneSignal.Notifications.requestPermission();
            console.log("[EnableNotifications] requestPermission() resolved, new browser permission:", Notification.permission);
          } catch (err) {
            console.error("[EnableNotifications] requestPermission() threw", err);
          }
          setState(Notification.permission as PermissionState);
        });
        console.log("[EnableNotifications] callback queued, OneSignalDeferred queue length after push:", window.OneSignalDeferred.length);
      }}
    >
      <IconAlerts className="size-4" />
      Enable notifications
    </Button>
  );
}
