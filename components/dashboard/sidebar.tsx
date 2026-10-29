"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FigmaIcon, navIcon } from "@/components/dashboard/figma-icon";
import { openAdvisor } from "@/components/dashboard/open-advisor";
import { LanguageToggle } from "@/components/language-toggle";

export type AppNavLink = {
  href: string;
  /** English label — used for title attributes and search filtering */
  label: string;
  /** Stable camelCase key matching dashboard.sidebar.links.* in messages */
  linkKey: string;
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
const IconEtf = navIcon("/marketing/dashboard/icon-trend.svg");

export const NAV_SECTIONS: { label: string; sectionKey: string; links: AppNavLink[] }[] = [
  {
    label: "Overview",
    sectionKey: "overview",
    links: [
      { href: "/dashboard", label: "Dashboard", linkKey: "dashboard", Icon: IconDashboard },
      { href: "/holdings", label: "Portfolio", linkKey: "portfolio", Icon: IconPortfolio },
      { href: "/diversification", label: "Allocation", linkKey: "allocation", Icon: IconPortfolio },
    ],
  },
  {
    label: "Income",
    sectionKey: "income",
    links: [
      { href: "/dividends", label: "Dividends", linkKey: "dividends", Icon: IconDividends },
      { href: "/calendar", label: "Calendar", linkKey: "calendar", Icon: IconCalendar },
      { href: "/upcoming", label: "Upcoming payments", linkKey: "upcomingPayments", Icon: IconCalendar },
      { href: "/history", label: "Payment history", linkKey: "paymentHistory", Icon: IconDividends },
    ],
  },
  {
    label: "Explore",
    sectionKey: "explore",
    links: [
      { href: "/etf-explorer", label: "ETF Explorer", linkKey: "etfExplorer", Icon: IconEtf },
      { href: "/collections", label: "Collections", linkKey: "collections", Icon: IconWatchlist },
    ],
  },
  {
    label: "Signals",
    sectionKey: "signals",
    links: [
      { href: "/notifications", label: "Notifications", linkKey: "notifications", Icon: IconNotifications },
      { href: "/alert-templates", label: "Alert templates", linkKey: "alertTemplates", Icon: IconNotifications },
      { href: "/watchlist", label: "Watchlist", linkKey: "watchlist", Icon: IconWatchlist },
    ],
  },
  {
    label: "Insight",
    sectionKey: "insight",
    links: [
      { href: "/analytics", label: "Analytics", linkKey: "analytics", Icon: IconAnalytics },
      // { href: "/performance", label: "Performance", linkKey: "performance", Icon: IconAnalytics }, // hidden – re-enable when ready
      // { href: "/goals", label: "Goals", linkKey: "goals", Icon: IconGoals }, // hidden – re-enable when ready
      { href: "/advisor", label: "AI Advisor", linkKey: "aiAdvisor", Icon: IconAdvisor },
    ],
  },
  {
    label: "Account",
    sectionKey: "account",
    links: [
      { href: "/brokers", label: "Broker connections", linkKey: "brokerConnections", Icon: IconBrokers },
      { href: "/settings", label: "Settings", linkKey: "settings", Icon: IconSettings },
      { href: "/help", label: "Help center", linkKey: "helpCenter", Icon: IconHelp },
    ],
  },
];

export const PRIMARY_TABS: AppNavLink[] = [
  { href: "/dashboard", label: "Dashboard", linkKey: "dashboard", Icon: IconDashboard },
  { href: "/holdings", label: "Portfolio", linkKey: "portfolio", Icon: IconPortfolio },
  { href: "/dividends", label: "Dividends", linkKey: "dividends", Icon: IconDividends },
  { href: "/calendar", label: "Calendar", linkKey: "calendar", Icon: IconCalendar },
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
  const t = useTranslations("dashboard.sidebar");
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
          <div key={section.sectionKey} className="flex flex-col gap-2">
            {collapsed ? null : (
              <div className="px-3 text-[10px] tracking-[2px] text-[#6c737f] uppercase">
                {t(`sections.${section.sectionKey}` as Parameters<typeof t>[0])}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const active = isLinkActive(pathname, tab, link.href, link.action);
                const translatedLabel = t(`links.${link.linkKey}` as Parameters<typeof t>[0]);
                const className = cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] leading-[23.1px] transition-colors",
                  collapsed && "justify-center px-0",
                  active ? "bg-[#16191d] text-[#4c82f7]" : "text-[#99a1ac] hover:bg-[#16191d] hover:text-[#f2f4f7]",
                );
                const inner = (
                  <>
                    <link.Icon className="size-[17px]" />
                    {collapsed ? null : translatedLabel}
                  </>
                );
                if (link.action === "advisor") {
                  return (
                    <button
                      key={link.linkKey}
                      type="button"
                      title={translatedLabel}
                      onClick={openAdvisor}
                      className={className}
                    >
                      {inner}
                    </button>
                  );
                }
                if (link.href.startsWith("mailto:")) {
                  return (
                    <a key={link.linkKey} href={link.href} title={translatedLabel} className={className}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={`${link.linkKey}-${link.href}`} href={link.href} title={translatedLabel} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#22262c] p-3 flex flex-col gap-1">
        {!collapsed && (
          <div className="px-3 py-1">
            <LanguageToggle variant="minimal" authenticated />
          </div>
        )}
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
          {collapsed ? null : t("collapse")}
        </button>
      </div>
    </nav>
  );
}
