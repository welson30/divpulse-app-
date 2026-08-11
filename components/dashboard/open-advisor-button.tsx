"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { cn } from "@/lib/utils";

type OpenAdvisorButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function OpenAdvisorButton({ className, children = "Open advisor" }: OpenAdvisorButtonProps) {
  return (
    <Link
      href="/advisor"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[13.8px] text-[13px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/50 hover:bg-[#1c2128]",
        className,
      )}
    >
      {children}
      <FigmaIcon src="/marketing/dashboard/icon-external.svg" className="size-[14px]" />
    </Link>
  );
}
