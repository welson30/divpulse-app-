// Shared config — no "use client" so server components can import safely.
export const SETTINGS_TABS = [
  { value: "profile", labelKey: "tabProfile", icon: "/marketing/dashboard/icon-settings-profile.svg" },
  { value: "security", labelKey: "tabSecurity", icon: "/marketing/dashboard/icon-settings-security.svg" },
  { value: "subscription", labelKey: "tabSubscription", icon: "/marketing/dashboard/icon-settings-subscription.svg" },
  { value: "billing", labelKey: "tabBilling", icon: "/marketing/dashboard/icon-settings-billing.svg" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];
