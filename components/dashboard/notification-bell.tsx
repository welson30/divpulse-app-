"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { EnableNotificationsButton } from "@/components/notifications/enable-notifications-button";
import { markNotificationsSeen } from "@/app/(dashboard)/notifications/actions";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { formatRelativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type RecentNotification = {
  id: string;
  ticker: string;
  amount: number;
  notifiedAt: string;
};

type NotificationBellProps = {
  notifications: RecentNotification[];
  initialUnreadCount: number;
};

/** The in-app notification center — every dashboard page, via AppShell. */
export function NotificationBell({ notifications, initialUnreadCount }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // Optimistic: the badge clears the instant the dropdown opens
        // rather than waiting on a round trip. The server write just has
        // to be correct by the next full navigation — see the comment on
        // markNotificationsSeen for why this deliberately skips
        // revalidatePath.
        if (open && unreadCount > 0) {
          setUnreadCount(0);
          startTransition(() => {
            markNotificationsSeen();
          });
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#121417] text-[#99a1ac] transition-colors hover:text-[#f2f4f7]"
        >
          <FigmaIcon src="/marketing/dashboard/icon-bell.svg" className="size-[17px]" />
          {unreadCount > 0 ? (
            <span aria-hidden className="absolute top-[9.8px] right-[9.8px] size-1.5 rounded-full bg-[#4c82f7]" />
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 pb-2">
          <span className="text-sm font-semibold text-text-primary">Notifications</span>
        </div>

        <div className="px-3 pb-2.5">
          <EnableNotificationsButton />
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="max-h-80 overflow-y-auto p-1">
          {notifications.length === 0 ? (
            <p className="px-2.5 py-5 text-center text-xs text-text-secondary">
              No notifications yet — you&rsquo;ll see dividend payments here as they&rsquo;re detected.
            </p>
          ) : (
            notifications.map((n) => {
              const rowContent = (
                <>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] font-mono text-[10px] font-bold text-green-500">
                    {n.ticker.slice(0, 4)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-text-primary">
                      <span className="font-semibold">{n.ticker}</span> · +${n.amount.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-text-secondary">{formatRelativeTime(n.notifiedAt)}</div>
                  </div>
                </>
              );

              // Plaid-synced options/futures tickers exceed the ticker-detail
              // route's own regex and would otherwise 404 — same guard used
              // on Holdings/Dashboard/Dividends (lib/tickers/validate.ts).
              return isLinkableTicker(n.ticker) ? (
                <DropdownMenuItem key={n.id} asChild>
                  <Link href={`/tickers/${n.ticker}`} className="flex items-center gap-2.5 px-2 py-2">
                    {rowContent}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <div key={n.id} className="flex items-center gap-2.5 px-2 py-2">
                  {rowContent}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
