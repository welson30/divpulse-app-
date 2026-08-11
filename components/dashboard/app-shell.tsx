import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { AiAdvisorWidget } from "@/components/dashboard/ai-advisor-widget";
import type { RecentNotification } from "@/components/dashboard/notification-bell";

type AppShellProps = {
  email: string;
  displayName: string | null;
  planLabel: string;
  isFree: boolean;
  isPro: boolean;
  holdingCount: number;
  notifications: RecentNotification[];
  unreadNotificationCount: number;
  children: React.ReactNode;
};

export function AppShell({
  email,
  displayName,
  planLabel,
  isFree,
  isPro,
  holdingCount,
  notifications,
  unreadNotificationCount,
  children,
}: AppShellProps) {
  return (
    <div className="pp-app fixed inset-0 flex overflow-hidden bg-[#0b0c0e]">
      <Suspense fallback={<div className="hidden h-screen w-[264px] shrink-0 border-r border-[#22262c] bg-[#121417] lg:block" />}>
        <Sidebar planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="hidden lg:flex" />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={email}
          displayName={displayName}
          planLabel={planLabel}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-24 lg:p-10 lg:pb-8">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>

      <BottomNav planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="lg:hidden" />

      <AiAdvisorWidget isPro={isPro} />
    </div>
  );
}
