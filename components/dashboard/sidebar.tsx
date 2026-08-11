"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FigmaIcon, navIcon } from "@/components/dashboard/figma-icon";
import { openAdvisor } from "@/components/dashboard/open-advisor";

export type AppNavLink = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  action?: "advisor";
};

const IconDashboard = navIcon("/marketing/dashboard/nav-dashboard.svg");
const IconPortfolio = navIcon("/marketing/dashboard/nav-portfolio.svg");
const IconDividends = navIcon("/marketing/dashboard/nav-dividends.svg");
const IconCalendar = navIcon("/marketing/dashboard/nav-calendar.svg");
const IconNotifications = navIcon("/marketing/dashboard/nav-notifications.svg");
const IconWatchlist = navIcon("/marketing/dashboard/nav-watchlist.svg");
const IconAnalytics = navIcon("/marketing/dashboard/nav-analytics.svg");
const IconGoals = navIcon("/marketing/dashboard/nav-goals.svg");
const IconAdvisor = navIcon("/marketing/dashboard/nav-advisor.svg");
const IconBrokers = navIcon("/marketing/dashboard/nav-brokers.svg");
const IconSettings = navIcon("/marketing/dashboard/nav-settings.svg");
const IconHelp = navIcon("/marketing/dashboard/nav-help.svg");

export const NAV_SECTIONS: { label: string; links: AppNavLink[] }[] = [
  {
    label: "Overview",
    links: [
      { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
      { href: "/holdings", label: "Portfolio", Icon: IconPortfolio },
      { href: "/diversification", label: "Allocation", Icon: IconPortfolio },
    ],
  },
  {
    label: "Income",
    links: [
      { href: "/dividends", label: "Dividends", Icon: IconDividends },
      { href: "/calendar", label: "Calendar", Icon: IconCalendar },
      { href: "/upcoming", label: "Upcoming payments", Icon: IconCalendar },
      { href: "/history", label: "Payment history", Icon: IconDividends },
    ],
  },
  {
    label: "Signals",
    links: [
      { href: "/notifications", label: "Notifications", Icon: IconNotifications },
      { href: "/alert-templates", label: "Alert templates", Icon: IconNotifications },
      { href: "/watchlist", label: "Watchlist", Icon: IconWatchlist },
    ],
  },
  {
    label: "Insight",
    links: [
      { href: "/analytics", label: "Analytics", Icon: IconAnalytics },
      { href: "/performance", label: "Performance", Icon: IconAnalytics },
      { href: "/goals", label: "Goals", Icon: IconGoals },
      { href: "/advisor", label: "AI Advisor", Icon: IconAdvisor },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/brokers", label: "Broker connections", Icon: IconBrokers },
      { href: "/settings", label: "Settings", Icon: IconSettings },
      { href: "mailto:support@paidprime.com", label: "Help center", Icon: IconHelp },
    ],
  },
];

export const PRIMARY_TABS: AppNavLink[] = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/holdings", label: "Portfolio", Icon: IconPortfolio },
  { href: "/dividends", label: "Dividends", Icon: IconDividends },
  { href: "/calendar", label: "Calendar", Icon: IconCalendar },
];

const PRIMARY_HREFS = new Set(PRIMARY_TABS.map((t) => t.href));

export function isPrimaryHref(href: string) {
  return PRIMARY_HREFS.has(href.split("?")[0]!);
}

function isLinkActive(pathname: string, tab: string | null, href: string, action?: AppNavLink["action"]) {
  if (action || href.startsWith("mailto:") || href === "#") return false;
  const url = new URL(href, "http://local");
  if (pathname !== url.pathname) return false;
  const linkTab = url.searchParams.get("tab");
  if (linkTab) return tab === linkTab;
  return true;
}

const COLLAPSE_KEY = "pp-sidebar-collapsed";

type SidebarProps = {
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // private mode
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-y-auto border-r border-[#22262c] bg-[#121417] transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[264px]",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-[#22262c] px-5",
          collapsed && "justify-center px-0",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="" width={24} height={24} className="size-6 shrink-0" />
        {collapsed ? null : (
          <span className="font-[family-name:var(--font-funnel-display)] text-[16px] font-semibold tracking-[-0.32px] text-[#f2f4f7]">
            PaidPrime
          </span>
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col gap-6 px-3 py-5", collapsed && "px-2")}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-2">
            {collapsed ? null : (
              <div className="px-3 text-[10px] tracking-[2px] text-[#6c737f] uppercase">{section.label}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const active = isLinkActive(pathname, tab, link.href, link.action);
                const className = cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] leading-[23.1px] transition-colors",
                  collapsed && "justify-center px-0",
                  active ? "bg-[#16191d] text-[#4c82f7]" : "text-[#99a1ac] hover:bg-[#16191d] hover:text-[#f2f4f7]",
                );
                const inner = (
                  <>
                    <link.Icon className="size-[17px]" />
                    {collapsed ? null : link.label}
                  </>
                );
                if (link.action === "advisor") {
                  return (
                    <button
                      key={link.label}
                      type="button"
                      title={link.label}
                      onClick={openAdvisor}
                      className={className}
                    >
                      {inner}
                    </button>
                  );
                }
                if (link.href.startsWith("mailto:")) {
                  return (
                    <a key={link.label} href={link.href} title={link.label} className={className}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={`${link.label}-${link.href}`} href={link.href} title={link.label} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#22262c] p-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] text-[#99a1ac] transition-colors hover:bg-[#16191d] hover:text-[#f2f4f7]",
            collapsed && "justify-center px-0",
          )}
        >
          <FigmaIcon
            src="/marketing/dashboard/nav-collapse.svg"
            className={cn("size-4", collapsed && "rotate-180")}
          />
          {collapsed ? null : "Collapse"}
        </button>
      </div>
    </nav>
  );
}
