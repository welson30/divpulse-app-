"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SettingsPanel, settingsPrimaryBtnClass, settingsSecondaryBtnClass } from "@/components/dashboard/settings-panel";

type BillingCardProps = {
  plan: "free" | "pro" | "pro_plus";
  planLabel: string;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
};

export function BillingCard({ plan, planLabel, periodEnd, hasStripeCustomer }: BillingCardProps) {
  const t = useTranslations("dashboard.subscription");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isFree = plan === "free";
  const isPro = plan === "pro";

  function startCheckout(targetPlan: "pro" | "pro_plus") {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) {
        setError(result.error ?? t("checkoutError"));
        return;
      }
      window.location.href = result.url;
    });
  }

  function openPortalForUpgrade() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) {
        setError(result.error ?? t("checkoutError"));
        return;
      }
      window.location.href = result.url;
    });
  }

  const period =
    periodEnd &&
    new Date(periodEnd).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const planDesc =
    plan === "free"
      ? t("freePlanDesc")
      : plan === "pro"
        ? t("proPlanDesc")
        : t("proPlusPlanDesc");

  return (
    <SettingsPanel
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        isFree ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={isPending} onClick={() => startCheckout("pro")} className={settingsPrimaryBtnClass}>
              {isPending ? t("upgradeOpening") : t("upgradePro")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startCheckout("pro_plus")}
              className={settingsSecondaryBtnClass}
            >
              {isPending ? t("upgradeOpening") : t("upgradeProPlus")}
            </button>
          </div>
        ) : isPro ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending || !hasStripeCustomer}
              onClick={openPortalForUpgrade}
              className={settingsPrimaryBtnClass}
            >
              {isPending ? t("upgradeOpening") : t("upgradeProPlus")}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="rounded-[14px] border border-[#22262c] bg-[#0b0c0e] px-5 py-4">
        <p className="text-[14px] font-medium text-[#f2f4f7]">{planLabel}</p>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{planDesc}</p>
        {period ? (
          <p className="mt-2 text-[12px] leading-[19.8px] text-[#6c737f]">
            {t("periodEnd", { date: period })}
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-[13px] text-[#d8695f]">
          {error}
        </p>
      ) : null}
    </SettingsPanel>
  );
}
