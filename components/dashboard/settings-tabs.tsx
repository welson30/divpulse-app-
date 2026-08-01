import Link from "next/link";
import { cn } from "@/lib/utils";

export const SETTINGS_TABS = [
  { value: "profile", label: "Profile & Preferences" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security" },
  { value: "integrations", label: "Integrations" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

export function SettingsTabs({ current }: { current: SettingsTab }) {
  return (
    <div className="flex gap-sp-4 overflow-x-auto border-b border-border-subtle" role="tablist" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.value === current;
        return (
          <Link
            key={tab.value}
            href={`/settings?tab=${tab.value}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-0.5 pb-3 font-sans text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-green-500 text-green-500"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
