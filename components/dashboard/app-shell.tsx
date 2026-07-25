"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  email: string;
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
  children: React.ReactNode;
};

export function AppShell({ email, planLabel, isFree, holdingCount, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop sidebar — always visible at lg+ */}
      <Sidebar planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className="hidden lg:flex" />

      {/* Mobile sidebar — off-canvas, toggled by the topbar's menu button */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0" onClick={() => setMobileNavOpen(false)}>
            <Sidebar planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} className={cn("flex")} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={email} planLabel={planLabel} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-sp-4 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
