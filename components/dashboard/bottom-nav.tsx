"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_TABS } from "@/components/dashboard/sidebar";
import { MoreSheet } from "@/components/dashboard/more-sheet";
import { IconMore } from "@/components/marketing/icons";

type BottomNavProps = {
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
  className?: string;
};

const TAB_ICON_WRAP = "flex items-center justify-center rounded-lg px-2.5 py-1";

export function BottomNav({ planLabel, isFree, holdingCount, className }: BottomNavProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMoreActive = !PRIMARY_TABS.some((tab) => tab.href === pathname);

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-[#22262c] bg-[#121417] pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        <div className="grid h-16 grid-cols-5">
          {PRIMARY_TABS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
                  isActive ? "text-[#4c82f7]" : "text-[#99a1ac]",
                )}
              >
                <span className={cn(TAB_ICON_WRAP, isActive && "bg-[#16191d]")}>
                  <link.Icon className="size-5" />
                </span>
                {link.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
              isMoreActive ? "text-[#4c82f7]" : "text-[#99a1ac]",
            )}
          >
            <span className={cn(TAB_ICON_WRAP, isMoreActive && "bg-[#16191d]")}>
              <IconMore className="size-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      <MoreSheet open={sheetOpen} onOpenChange={setSheetOpen} planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} />
    </>
  );
}
