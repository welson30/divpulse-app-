"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Crown, Sparkles } from "lucide-react";

type BillingCardProps = {
  plan: "free" | "pro" | "pro_plus";
  planLabel: string;
};

export function BillingCard({ plan, planLabel }: BillingCardProps) {
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
      {isFree ? (
        <div className="flex items-center gap-sp-3 rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold text-text-primary">{planLabel}</div>
            <div className="text-xs text-text-secondary">Up to 5 tracked assets, manual entry only</div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={openPortal}
          className="flex w-full items-center gap-sp-3 rounded-card border border-green-500/20 bg-surface-2 p-sp-3 text-left transition-colors hover:border-green-500/40 disabled:opacity-60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.12)] text-green-500">
            <Crown className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold text-text-primary">You&rsquo;re on {planLabel}</div>
            <div className="text-xs text-text-secondary">Unlimited manual tracking</div>
          </div>
          <span className="shrink-0 font-sans text-xs font-medium text-text-secondary">
            {isPending ? "Opening…" : "Manage billing"}
          </span>
          <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        </button>
      )}

      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {isFree ? (
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
