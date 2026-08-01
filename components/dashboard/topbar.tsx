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
};

export function Topbar({ email, planLabel }: TopbarProps) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border-subtle bg-sidebar px-4 lg:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
        <img src="/logo.svg" alt="" className="size-7 rounded-md" width={28} height={28} />
        <span className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-sidebar-foreground">
          Paid<span className="text-green-500">Prime</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <div className="lg:hidden">
          <EnableNotificationsButton compact />
        </div>
        <div className="hidden lg:flex">
          <EnableNotificationsButton />
        </div>

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
