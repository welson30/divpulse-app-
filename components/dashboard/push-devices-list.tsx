"use client";

import { useTransition } from "react";
import { removePushDevice } from "@/app/(dashboard)/settings/actions";

export type PushDevice = {
  id: string;
  user_agent: string | null;
  created_at: string;
};

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/iphone|ipad/i.test(userAgent)) return "iOS device";
  if (/android/i.test(userAgent)) return "Android device";
  if (/macintosh/i.test(userAgent)) return "Mac";
  if (/windows/i.test(userAgent)) return "Windows PC";
  return "Browser";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PushDevicesList({ devices }: { devices: PushDevice[] }) {
  const [isPending, startTransition] = useTransition();

  if (devices.length === 0) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3 text-sm text-text-secondary">
        No devices registered yet. Use &ldquo;Enable notifications&rdquo; from the dashboard to add this one.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {devices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface p-sp-2.5"
        >
          <div className="min-w-0">
            <div className="text-sm text-text-primary">{describeDevice(device.user_agent)}</div>
            <div className="text-xs text-text-secondary">Added {formatDate(device.created_at)}</div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => removePushDevice(device.id))}
            className="shrink-0 font-sans text-xs text-text-secondary transition-colors hover:text-red-500 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
