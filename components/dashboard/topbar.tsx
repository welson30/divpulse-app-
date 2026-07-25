"use client";

import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { EnableNotificationsButton } from "@/components/notifications/enable-notifications-button";
import { IconSettings, IconLogOut } from "@/components/marketing/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type TopbarProps = {
  email: string;
  planLabel: string;
  onMenuClick?: () => void;
};

export function Topbar({ email, planLabel, onMenuClick }: TopbarProps) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border-subtle bg-sidebar px-4 lg:px-6">
      {onMenuClick ? (
        <button
          type="button"
          onClick={onMenuClick}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-2 lg:hidden"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="size-5">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <EnableNotificationsButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-[rgba(34,197,94,0.12)] font-mono text-[11px] font-bold text-green-500 transition-colors hover:border-green-500/50"
              title={email}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{email}</DropdownMenuLabel>
            <div className="px-2.5 pb-1.5 text-xs text-green-500">{planLabel} plan</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <IconSettings className="size-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut} className="w-full">
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className="w-full">
                  <IconLogOut className="size-3.5" />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
