"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import {
  IconHome,
  IconHoldings,
  IconDividends,
  IconCalendar,
  IconCollections,
  IconDiversification,
  IconWatchlist,
  IconGoals,
  IconSettings,
  IconLogOut,
} from "@/components/marketing/icons";

const NAV_SECTIONS = [
  {
    label: "Main",
    links: [
      { href: "/dashboard", label: "For You", Icon: IconHome },
      { href: "/holdings", label: "Holdings", Icon: IconHoldings },
      { href: "/dividends", label: "Dividends", Icon: IconDividends },
      { href: "/calendar", label: "Calendar", Icon: IconCalendar },
    ],
  },
  {
    label: "Explore",
    links: [
      { href: "/collections", label: "Collections", Icon: IconCollections },
      { href: "/diversification", label: "Diversification", Icon: IconDiversification },
      { href: "/watchlist", label: "Watchlist", Icon: IconWatchlist },
      { href: "/goals", label: "Goals", Icon: IconGoals },
    ],
  },
  {
    label: "Account",
    links: [{ href: "/settings", label: "Settings", Icon: IconSettings }],
  },
] as const;

type SidebarProps = {
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
  className?: string;
};

export function Sidebar({ planLabel, isFree, holdingCount, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4 py-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
        <img src="/logo.svg" alt="" className="size-8 rounded-lg" width={32} height={32} />
        <span className="font-display text-[17px] font-extrabold tracking-[-0.01em] text-sidebar-foreground">
          Paid<span className="text-green-500">Prime</span>
        </span>
      </Link>

      <div className="flex-1 px-2 py-2.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-2 pt-2.5 pb-1.5 font-mono text-[9px] font-bold tracking-[0.1em] text-text-tertiary uppercase">
              {section.label}
            </div>
            {section.links.map((link) => {
              const isActive = pathname === link.href || pathname === link.href.split("#")[0];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "mb-px flex items-center gap-2.5 rounded-md px-2.5 py-2.5 font-sans text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-green-500"
                      : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-text-primary",
                  )}
                >
                  <link.Icon className={cn("size-4 shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <div className="mb-2 rounded-lg border border-green-500/20 bg-[rgba(34,197,94,0.06)] px-3 py-2.5">
          <div className="font-mono text-[9px] font-medium text-text-secondary">Current plan</div>
          <div className="text-xs font-bold text-green-500">
            {planLabel}
            {isFree ? ` · ${holdingCount}/5 holdings` : ""}
          </div>
        </div>
        {isFree ? (
          <Link
            href="/settings"
            className="mb-2 block w-full rounded-md bg-green-500 py-2.5 text-center font-sans text-xs font-bold text-canvas transition-colors hover:bg-green-500/90"
          >
            Upgrade to Pro
          </Link>
        ) : null}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-center font-sans text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-red-500"
          >
            <IconLogOut className="size-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
