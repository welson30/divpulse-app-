"use client";

import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { HeaderSearch } from "@/components/dashboard/header-search";
import { NotificationBell, type RecentNotification } from "@/components/dashboard/notification-bell";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
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

function getInitials(email: string, displayName: string | null) {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return `${first}${last}`.toUpperCase() || email.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function shortName(email: string, displayName: string | null) {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    return `${parts[0]} ${parts[parts.length - 1]![0]}.`;
  }
  return email.split("@")[0] ?? "You";
}

export function Topbar({ email, displayName, planLabel, notifications, unreadNotificationCount }: TopbarProps) {
  const initials = getInitials(email, displayName);
  const name = displayName?.trim() || email;
  const compact = shortName(email, displayName);

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b border-[#22262c] bg-[rgba(11,12,14,0.9)] px-4 backdrop-blur-[4px] lg:px-8">
      <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="" width={24} height={24} className="size-6" />
        <span className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.3px] text-[#f2f4f7]">
          PaidPrime
        </span>
      </Link>

      <HeaderSearch />

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell notifications={notifications} initialUnreadCount={unreadNotificationCount} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 items-center gap-2.5 rounded-[10px] border border-[#22262c] bg-[#121417] py-0 pr-3 pl-2 transition-colors hover:border-[#2e343b]"
              title={name}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-[8px] bg-[#16233d] text-[11px] text-[#4c82f7]">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate text-[13px] text-[#99a1ac] sm:inline">{compact}</span>
              <FigmaIcon src="/marketing/dashboard/icon-chevron.svg" className="hidden size-[14px] text-[#99a1ac] sm:inline-block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60 p-0">
            <div className="flex items-center gap-2.5 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#16233d] text-xs font-medium text-[#4c82f7]">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-text-primary">{name}</div>
                <div className="truncate text-xs text-text-secondary">{email}</div>
              </div>
            </div>
            <div className="px-3 pb-2.5">
              <span className="inline-flex items-center rounded-full bg-[#16233d] px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] text-[#4c82f7] uppercase">
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
