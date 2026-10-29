"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { SETTINGS_TABS, type SettingsTab } from "@/components/dashboard/settings-tabs-config";

export { SETTINGS_TABS } from "@/components/dashboard/settings-tabs-config";
export type { SettingsTab } from "@/components/dashboard/settings-tabs-config";

export function SettingsTabs({ current }: { current: SettingsTab }) {
  const t = useTranslations("dashboard.settings");
  return (
    <nav className="flex w-full shrink-0 flex-row gap-2 overflow-x-auto min-[900px]:w-[220px] min-[900px]:flex-col min-[900px]:gap-2" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.value === current;
        return (
          <Link
            key={tab.value}
            href={`/settings?tab=${tab.value}`}
            className={cn(
              "inline-flex h-[41px] shrink-0 items-center gap-2.5 rounded-[10px] px-3.5 text-[13px] font-medium",
              isActive ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#99a1ac] hover:text-[#f2f4f7]",
            )}
          >
            <FigmaIcon src={tab.icon} className={cn("size-[15px]", isActive ? "text-[#f2f4f7]" : "text-[#99a1ac]")} />
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
