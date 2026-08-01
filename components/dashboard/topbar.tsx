"use client";

import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { HeaderSearch } from "@/components/dashboard/header-search";
import { NotificationBell, type RecentNotification } from "@/components/dashboard/notification-bell";
import { IconSettings, IconLogOut } from "@/components/marketing/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type TopbarProps = {
  email: string;
  displayName: string | null;
  planLabel: string;
  notifications: RecentNotification[];
  unreadNotificationCount: number;
};

/** "Shuja Uddin" -> "SU"; falls back to the first two letters of the email's local part when no display name is set. */
function getInitials(email: string, displayName: string | null) {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return `${first}${last}`.toUpperCase() || email.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function Topbar({ email, displayName, planLabel, notifications, unreadNotificationCount }: TopbarProps) {
  const initials = getInitials(email, displayName);
  const name = displayName?.trim() || email;

  return (
    <header className="relative flex h-13 shrink-0 items-center gap-3 border-b border-border-subtle bg-sidebar px-4 lg:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
        <img src="/logo.svg" alt="" className="size-7 rounded-md" width={28} height={28} />
        <span className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-sidebar-foreground">
          Paid<span className="text-green-500">Prime</span>
        </span>
      </Link>

      {/* One HeaderSearch instance, not two — it owns the palette's
          open/query state and its single <Dialog>, so rendering it twice
          (once per breakpoint) would double both. Its desktop trigger is
          absolutely positioned to sit centered in the header regardless
          of the logo/icon-cluster's widths; its mobile trigger flows
          normally inside the icon cluster below. */}
      <div className="ml-auto flex items-center gap-1 lg:gap-3">
        <HeaderSearch />
        <NotificationBell notifications={notifications} initialUnreadCount={unreadNotificationCount} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8.5 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-[rgba(34,197,94,0.12)] font-mono text-[11px] font-bold text-green-500 transition-colors hover:border-green-500/50"
              title={name}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60 p-0">
            <div className="flex items-center gap-2.5 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-[rgba(34,197,94,0.12)] font-mono text-xs font-bold text-green-500">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-text-primary">{name}</div>
                <div className="truncate text-xs text-text-secondary">{email}</div>
              </div>
            </div>
            <div className="px-3 pb-2.5">
              <span className="inline-flex items-center rounded-full bg-[rgba(34,197,94,0.12)] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] text-green-500 uppercase">
                {planLabel} plan
              </span>
            </div>
            <DropdownMenuSeparator className="mx-0" />
            <div className="p-1">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <IconSettings className="size-3.5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <form action={signOut}>
                <DropdownMenuItem asChild variant="destructive">
                  <button type="submit" className="w-full">
                    <IconLogOut className="size-3.5" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
