"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconAlerts, IconCheck } from "@/components/marketing/icons";
import { getOneSignal } from "@/components/onesignal/onesignal-provider";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function EnableNotificationsButton() {
  const [state, setState] = useState<PermissionState>("default");

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
    <Button
      type="button"
      variant="secondary"
      className="h-9 gap-1.5 text-[13px]"
      onClick={async () => {
        try {
          const OneSignal = await getOneSignal();
          await OneSignal.Notifications.requestPermission();
        } catch (err) {
          console.error("[EnableNotifications] failed to request permission", err);
        }
        setState(Notification.permission as PermissionState);
      }}
    >
      <IconAlerts className="size-4" />
      Enable notifications
    </Button>
  );
}
