"use client";

import { useState, useTransition } from "react";
import { SettingsPanel, settingsPrimaryBtnClass, settingsSecondaryBtnClass } from "@/components/dashboard/settings-panel";

export function SettingsBillingPanel({ hasStripeCustomer }: { hasStripeCustomer: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openPortal() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) {
        setError(result.error ?? "Couldn't open billing management.");
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <SettingsPanel title="Billing" subtitle="Invoices, payment method, and a copy of your data">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
          {hasStripeCustomer
            ? "Card details and invoices live in the Stripe customer portal."
            : "No billing account yet — subscribe first, then invoices and payment methods show up here."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isPending || !hasStripeCustomer} onClick={openPortal} className={settingsPrimaryBtnClass}>
            {isPending ? "Opening…" : "Manage billing"}
          </button>
          <a href="/api/account/export" className={settingsSecondaryBtnClass}>
            Download my data
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
