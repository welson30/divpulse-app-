"use client";

import { useState, useTransition } from "react";

type BillingCardProps = {
  plan: "free" | "pro" | "pro_plus";
  planLabel: string;
};

export function BillingCard({ plan, planLabel }: BillingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startCheckout(targetPlan: "pro" | "pro_plus") {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong starting checkout.");
        return;
      }
      window.location.href = result.url;
    });
  }

  function openPortal() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Couldn't open billing management.");
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <div className="flex items-center justify-between rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <div>
          <div className="font-mono text-sm font-semibold text-text-primary">{planLabel}</div>
          <div className="text-xs text-text-secondary">
            {plan === "free" ? "Up to 5 tracked assets, manual entry only" : "Unlimited manual tracking"}
          </div>
        </div>
        {plan !== "free" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={openPortal}
            className="shrink-0 rounded-control border border-border-interactive px-3 py-1.5 font-sans text-xs font-medium text-text-primary transition-colors hover:border-green-500 disabled:opacity-40"
          >
            {isPending ? "Opening…" : "Manage billing"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {plan === "free" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startCheckout("pro")}
            className="flex-1 rounded-control bg-green-500 px-3.5 py-2.5 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-green-500/90 disabled:opacity-40"
          >
            {isPending ? "Opening…" : "Upgrade to Pro — $59/yr"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startCheckout("pro_plus")}
            className="flex-1 rounded-control border border-border-interactive px-3.5 py-2.5 font-sans text-sm font-semibold text-text-primary transition-colors hover:border-green-500 disabled:opacity-40"
          >
            {isPending ? "Opening…" : "Upgrade to Pro+ — $119/yr"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
