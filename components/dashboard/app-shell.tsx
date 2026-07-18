"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBell } from "@/components/marketing/icons";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "For You" },
  { href: "/holdings", label: "Holdings" },
] as const;

// Not-yet-built product routes, per ARCHITECTURE.md §6 — shown as inert
// chrome (same treatment the marketing ProductTabs demo uses) so the shell
// reads as the real app's nav, not a partial one, without linking to 404s.
const COMING_LINKS = ["Dividends", "Calendar", "Collections", "Diversification", "Payments"];

type AppShellProps = {
  email: string;
  planLabel: string;
  children: React.ReactNode;
};

export function AppShell({ email, planLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-border-subtle bg-surface-2">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-sp-2 px-sp-3 py-2.5">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
            <img src="/logo.svg" alt="" className="h-6 w-6 rounded-[7px]" width={24} height={24} />
            <span className="font-display text-sm font-semibold tracking-[-0.01em] text-text-primary">
              Paid<span className="text-green-500">Prime</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border-subtle bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold text-text-secondary sm:inline">
              {planLabel}
            </span>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border-interactive"
            >
              <IconBell className="size-4" />
            </button>
            <div
              title={email}
              className="flex size-8 items-center justify-center rounded-full border border-green-500/30 bg-[rgba(34,197,94,0.12)] font-mono text-[11px] font-bold text-green-500"
            >
              {initials}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="font-sans text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-[1180px] items-center gap-sp-3 overflow-x-auto px-sp-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative shrink-0 py-3 font-sans text-[13px] font-medium whitespace-nowrap transition-colors",
                  isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {link.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-0 -bottom-px left-0 h-[2px] rounded-full bg-green-500 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
          <span aria-hidden className="h-4 w-px shrink-0 bg-border-subtle" />
          {COMING_LINKS.map((label) => (
            <span key={label} className="shrink-0 py-3 font-sans text-[13px] text-text-secondary/40 whitespace-nowrap" aria-disabled>
              {label}
            </span>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-sp-3 py-sp-4">{children}</main>
    </div>
  );
}
