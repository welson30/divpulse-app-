"use client";

import Link from "next/link";
import { useRef, type CSSProperties, type MouseEvent } from "react";
import { PrimaryCta } from "@/components/marketing/primary-cta";
import { Reveal } from "@/components/marketing/reveal";

type FeatureValue = { type: "text"; label: string } | { type: "check" } | { type: "dash" };

type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: { label: string; value: FeatureValue }[];
};

// Matches the real plans (profiles.plan: "free" | "pro" | "pro_plus") and
// their actual Stripe prices/feature gates — see
// components/dashboard/billing-card.tsx ($59/yr, $119/yr), the isPro check
// in app/(dashboard)/advisor/page.tsx and alert-templates-board.tsx
// (AI Advisor + Telegram, both Pro and Pro+), FREE_PLAN_HOLDING_CAP in
// holdings/actions.ts (5), and the isProPlus gate on CSV import /
// broker auto-sync (import-csv-dialog.tsx, plaid-connect-dialog.tsx).
// Deliberately no invented tiers or features — this page previously showed
// fictional "Investor"/"Wealth" plans at $12/mo and $29/mo that don't
// exist anywhere in the actual product or Stripe setup.
const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Track up to 5 holdings and never miss a payment.",
    cta: "Get Started Free",
    href: "/signup",
    features: [
      { label: "Tracked holdings", value: { type: "text", label: "5 holdings" } },
      { label: "Real-time payment alerts", value: { type: "check" } },
      { label: "Dividend calendar", value: { type: "check" } },
      { label: "Watchlist", value: { type: "text", label: "Unlimited" } },
      { label: "Analytics", value: { type: "check" } },
      { label: "Financial goals", value: { type: "check" } },
      { label: "AI Advisor", value: { type: "dash" } },
      { label: "Telegram alerts", value: { type: "dash" } },
      { label: "CSV import", value: { type: "dash" } },
      { label: "Broker auto-sync", value: { type: "dash" } },
    ],
  },
  {
    name: "Pro",
    price: "$59",
    period: "/yr",
    description: "Unlimited manual tracking for active dividend investors.",
    cta: "Start with Pro",
    href: "/signup",
    featured: true,
    features: [
      { label: "Tracked holdings", value: { type: "text", label: "Unlimited" } },
      { label: "Real-time payment alerts", value: { type: "check" } },
      { label: "Dividend calendar", value: { type: "check" } },
      { label: "Watchlist", value: { type: "text", label: "Unlimited" } },
      { label: "Analytics", value: { type: "check" } },
      { label: "Financial goals", value: { type: "check" } },
      { label: "AI Advisor", value: { type: "check" } },
      { label: "Telegram alerts", value: { type: "check" } },
      { label: "CSV import", value: { type: "dash" } },
      { label: "Broker auto-sync", value: { type: "dash" } },
    ],
  },
  {
    name: "Pro+",
    price: "$119",
    period: "/yr",
    description: "Unlimited tracking, CSV import, and broker auto-sync.",
    cta: "Start with Pro+",
    href: "/signup",
    features: [
      { label: "Tracked holdings", value: { type: "text", label: "Unlimited" } },
      { label: "Real-time payment alerts", value: { type: "check" } },
      { label: "Dividend calendar", value: { type: "check" } },
      { label: "Watchlist", value: { type: "text", label: "Unlimited" } },
      { label: "Analytics", value: { type: "check" } },
      { label: "Financial goals", value: { type: "check" } },
      { label: "AI Advisor", value: { type: "check" } },
      { label: "Telegram alerts", value: { type: "check" } },
      { label: "CSV import", value: { type: "check" } },
      { label: "Broker auto-sync", value: { type: "check" } },
    ],
  },
];

function FeatureValue({ value }: { value: FeatureValue }) {
  if (value.type === "text") {
    return (
      <span className="text-[15px] leading-[24.75px] font-medium whitespace-nowrap text-[#f2f4f7]">
        {value.label}
      </span>
    );
  }
  if (value.type === "check") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/marketing/pricing/icon-check.svg"
        alt=""
        width={19}
        height={19}
        className="size-[19px]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/marketing/pricing/icon-dash.svg"
      alt=""
      width={17}
      height={17}
      className="size-[17px]"
    />
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative flex h-full flex-col rounded-[22px] border p-7 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:-translate-y-2 motion-reduce:hover:translate-y-0 min-[1200px]:p-[35.8px] ${
        plan.featured
          ? "z-10 border-[#4c82f7] bg-[#121417] shadow-[0_0_0_1px_rgba(76,130,247,0.35),0_24px_60px_-20px_rgba(76,130,247,0.45)] hover:shadow-[0_0_0_1px_rgba(76,130,247,0.55),0_32px_80px_-18px_rgba(76,130,247,0.55)]"
          : "border-[#2e343b] bg-[#121417] hover:border-[#4c82f7]/55 hover:shadow-[0_28px_70px_-28px_rgba(76,130,247,0.4)]"
      }`}
      style={
        {
          "--spot-x": "50%",
          "--spot-y": "30%",
        } as CSSProperties
      }
    >
      {/* Cursor spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(76,130,247,0.16), transparent 42%)",
        }}
      />

      {plan.featured ? (
        <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#4c82f7]/50 bg-[#16233d] px-3 py-1 text-[12px] font-medium tracking-[1.2px] text-[#4c82f7] uppercase shadow-[0_8px_24px_-8px_rgba(76,130,247,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/pricing/icon-sparkle.svg"
              alt=""
              width={12}
              height={12}
              className="size-3"
            />
            Most popular
          </div>
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col">
        <h3 className="pp-display m-0 text-[22px] leading-[36.3px] font-semibold tracking-[-0.44px] text-[#f2f4f7]">
          {plan.name}
        </h3>

        <p className="pp-display m-0 mt-4 flex items-baseline gap-1 text-[clamp(42px,8vw,62px)] font-semibold leading-none tracking-[-1.24px] text-[#f2f4f7]">
          {plan.price}
          {plan.period ? (
            <span className="text-[18px] font-medium tracking-normal text-[#99a1ac]">
              {plan.period}
            </span>
          ) : null}
        </p>

        <p className="m-0 mt-4 min-h-[52px] text-[16px] leading-[26px] text-[#99a1ac]">
          {plan.description}
        </p>

        {plan.featured ? (
          <PrimaryCta
            href={plan.href}
            className="mt-8 h-14 w-full rounded-[18px] text-[17px]"
          >
            {plan.cta}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/pricing/icon-arrow-white.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </PrimaryCta>
        ) : (
          <Link
            href={plan.href}
            className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border border-[#2e343b] bg-[#16191d] text-[17px] font-semibold text-[#f2f4f7] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-[#4c82f7]/60 hover:bg-[#1a1f26] hover:-translate-y-0.5"
          >
            {plan.cta}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/pricing/icon-arrow.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        )}

        <ul className="m-0 mt-9 flex list-none flex-col gap-4 border-t border-[#22262c] p-0 pt-7">
          {plan.features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-[15px] leading-[26.4px] text-[#99a1ac] sm:text-[16px]">
                {feature.label}
              </span>
              <FeatureValue value={feature.value} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Figma Homepage section 1:2112 — Pricing.
 * Shell: 1440 → px-60 → 1320 → px-12. Desktop ≥1200 = Figma; tablet/mobile = judgment.
 * Hover: lift + cursor spotlight + border/glow intensify.
 */
export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="pricing-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(76,130,247,0.14), transparent 70%)",
        }}
      />

      <div className="relative mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-[128px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-10 min-[1200px]:gap-12 min-[1200px]:px-12">
          <Reveal className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-4 text-center min-[1200px]:gap-[23px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
              <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
              Pricing
            </div>

            <h2
              id="pricing-heading"
              className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
            >
              Plans that scale with your{" "}
              <br className="hidden min-[1200px]:block" />
              portfolio
            </h2>

            <p className="m-0 max-w-[780px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[21.6px] min-[1200px]:leading-[34.56px]">
              Start free with five holdings. Upgrade when you need unlimited tracking, the AI
              Advisor and Telegram alerts, or CSV import and broker auto-sync.
            </p>
          </Reveal>

          <Reveal delayMs={80} className="w-full">
            <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 min-[1024px]:grid-cols-3 min-[1200px]:gap-6 min-[1200px]:pt-4">
              {PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </Reveal>

          <p className="m-0 max-w-[720px] text-center text-[15px] leading-[26.4px] text-[#6c737f] min-[1200px]:text-[16px]">
            Broker auto-sync is read-only and Pro+ only — PaidPrime can never place trades or
            move funds. Encrypted storage and cancel-anytime billing on every plan.
          </p>
        </div>
      </div>
    </section>
  );
}
