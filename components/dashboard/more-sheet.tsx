"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, PRIMARY_TABS } from "@/components/dashboard/sidebar";
import { SidebarAccountFooter } from "@/components/dashboard/sidebar-account-footer";
import { openAdvisor } from "@/components/dashboard/open-advisor";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const PRIMARY_HREFS = new Set(PRIMARY_TABS.map((t) => t.href));

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
};

export function MoreSheet({ open, onOpenChange, planLabel, isFree, holdingCount }: MoreSheetProps) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter((link) => !PRIMARY_HREFS.has(link.href.split("?")[0]!)),
  })).filter((section) => section.links.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {sections.map((section) => (
          <div key={section.label} className="mb-2">
            <div className="px-2 pt-1.5 pb-1.5 text-[10px] tracking-[2px] text-[#6c737f] uppercase">{section.label}</div>
            {section.links.map((link) => {
              const isActive = pathname === link.href.split("?")[0];
              const className = cn(
                "mb-px flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-[13px] font-medium transition-colors",
                isActive ? "bg-[#16191d] text-[#4c82f7]" : "text-[#99a1ac] hover:bg-[#16191d] hover:text-[#f2f4f7]",
              );
              const inner = (
                <>
                  <link.Icon className="size-4 shrink-0" />
                  {link.label}
                </>
              );
              if (link.action === "advisor") {
                return (
                  <button
                    key={link.label}
                    type="button"
                    className={cn(className, "w-full text-left")}
                    onClick={() => {
                      onOpenChange(false);
                      openAdvisor();
                    }}
                  >
                    {inner}
                  </button>
                );
              }
              if (link.href.startsWith("mailto:")) {
                return (
                  <a key={link.label} href={link.href} className={className} onClick={() => onOpenChange(false)}>
                    {inner}
                  </a>
                );
              }
              return (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className={className}
                >
                  {inner}
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
