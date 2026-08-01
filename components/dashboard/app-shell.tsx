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
    <div className="fixed inset-0 flex overflow-hidden bg-canvas">
      {/* Desktop sidebar — always visible at lg+ */}
      <Sidebar planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={email}
          displayName={displayName}
          planLabel={planLabel}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-sp-4 pb-20 lg:px-8 lg:pt-sp-4 lg:pb-sp-4">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar — replaces the sidebar below lg: */}
      <BottomNav planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="lg:hidden" />

      {/* Lives in the shell rather than per page so the conversation
          survives client-side navigation. isPro only picks which panel
          renders — the real gate is server-side in /api/advisor/query. */}
      <AiAdvisorWidget isPro={isPro} />
    </div>
  );
}
