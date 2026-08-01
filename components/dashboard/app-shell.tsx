import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";

type AppShellProps = {
  email: string;
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
  children: React.ReactNode;
};

export function AppShell({ email, planLabel, isFree, holdingCount, children }: AppShellProps) {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-canvas">
      {/* Desktop sidebar — always visible at lg+ */}
      <Sidebar planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={email} planLabel={planLabel} />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-sp-4 pb-20 lg:px-8 lg:pt-sp-4 lg:pb-sp-4">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar — replaces the sidebar below lg: */}
      <BottomNav planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="lg:hidden" />
    </div>
  );
}
