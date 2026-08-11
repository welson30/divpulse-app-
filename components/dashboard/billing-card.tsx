"use client";

import { useState, useTransition } from "react";
import { SettingsPanel, settingsPrimaryBtnClass, settingsSecondaryBtnClass } from "@/components/dashboard/settings-panel";

type BillingCardProps = {
  plan: "free" | "pro" | "pro_plus";
  planLabel: string;
  periodEnd: string | null;
};

export function BillingCard({ plan, planLabel, periodEnd }: BillingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isFree = plan === "free";

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
        setError(result.error ?? "Something went wrong starting checkout.");
        return;
      }
      window.location.href = result.url;
    });
  }

  const period =
    periodEnd &&
    new Date(periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <SettingsPanel
      title="Subscription"
      subtitle="Your current plan"
      footer={
        isFree ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={isPending} onClick={() => startCheckout("pro")} className={settingsPrimaryBtnClass}>
              {isPending ? "Opening…" : "Upgrade to Pro — $59/yr"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startCheckout("pro_plus")}
              className={settingsSecondaryBtnClass}
            >
              {isPending ? "Opening…" : "Upgrade to Pro+ — $119/yr"}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="rounded-[14px] border border-[#22262c] bg-[#0b0c0e] px-5 py-4">
        <p className="text-[14px] font-medium text-[#f2f4f7]">{planLabel}</p>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
          {plan === "free"
            ? "Up to 5 tracked assets, manual entry only"
            : plan === "pro"
              ? "Unlimited manual tracking"
              : "Unlimited tracking, CSV import, and broker auto-sync"}
        </p>
        {period ? <p className="mt-2 text-[12px] leading-[19.8px] text-[#6c737f]">Current period ends {period}</p> : null}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-[13px] text-[#d8695f]">
          {error}
        </p>
      ) : null}
    </SettingsPanel>
  );
}
