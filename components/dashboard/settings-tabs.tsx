import Link from "next/link";
import { cn } from "@/lib/utils";
import { FigmaIcon } from "@/components/dashboard/figma-icon";

export const SETTINGS_TABS = [
  { value: "profile", label: "Profile", icon: "/marketing/dashboard/icon-settings-profile.svg" },
  { value: "security", label: "Security", icon: "/marketing/dashboard/icon-settings-security.svg" },
  { value: "subscription", label: "Subscription", icon: "/marketing/dashboard/icon-settings-subscription.svg" },
  { value: "billing", label: "Billing", icon: "/marketing/dashboard/icon-settings-billing.svg" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

export function SettingsTabs({ current }: { current: SettingsTab }) {
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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
