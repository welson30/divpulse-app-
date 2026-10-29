"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { SettingsPanel, settingsPrimaryBtnClass, settingsSecondaryBtnClass } from "@/components/dashboard/settings-panel";

export function SettingsBillingPanel({ hasStripeCustomer }: { hasStripeCustomer: boolean }) {
  const t = useTranslations("dashboard.settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openPortal() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) {
        setError(result.error ?? t("billingError"));
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <SettingsPanel title={t("billingTitle")} subtitle={t("billingSubtitle")}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
          {hasStripeCustomer ? t("billingHasCustomer") : t("billingNoCustomer")}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isPending || !hasStripeCustomer} onClick={openPortal} className={settingsPrimaryBtnClass}>
            {isPending ? t("billingManageOpening") : t("billingManage")}
          </button>
          <a href="/api/account/export" className={settingsSecondaryBtnClass}>
            {t("billingDownload")}
          </a>
        </div>
        {error ? (
          <p role="alert" className="text-[13px] text-[#d8695f]">
            {error}
          </p>
        ) : null}
      </div>
    </SettingsPanel>
  );
}
