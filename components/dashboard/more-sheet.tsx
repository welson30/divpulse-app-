"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/components/dashboard/sidebar";
import { SidebarAccountFooter } from "@/components/dashboard/sidebar-account-footer";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
};

export function MoreSheet({ open, onOpenChange, planLabel, isFree, holdingCount }: MoreSheetProps) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS.filter((section) => section.label !== "Main");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {sections.map((section) => (
          <div key={section.label} className="mb-2">
            <div className="px-2 pt-1.5 pb-1.5 font-mono text-[9px] font-bold tracking-[0.1em] text-text-tertiary uppercase">
              {section.label}
            </div>
            {section.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "mb-px flex items-center gap-2.5 rounded-md px-2.5 py-2.5 font-sans text-[13px] font-medium transition-colors",
                    isActive ? "bg-sidebar-accent text-green-500" : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-text-primary",
                  )}
                >
                  <link.Icon className={cn("size-4 shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="mt-2 border-t border-border-subtle pt-3">
          <SidebarAccountFooter planLabel={planLabel} isFree={isFree} holdingCount={holdingCount} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
