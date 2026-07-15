import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { ReceiptCard } from "@/components/marketing/receipt-card";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { ProductTabs } from "@/components/marketing/product-tabs";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  IconAlerts,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconDiversification,
  IconEye,
  IconGrowth,
  IconHoldings,
  IconLock,
  IconPlug,
} from "@/components/marketing/icons";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#pricing", label: "Pricing" },
];

const RECENT_RECEIPTS = [
  { ticker: "KO", name: "Coca-Cola Co.", cadence: "Quarterly dividend", amount: 46.2, when: "Just now" },
  { ticker: "JNJ", name: "Johnson & Johnson", cadence: "Quarterly dividend", amount: 128.5, when: "Yesterday" },
  { ticker: "PG", name: "Procter & Gamble", cadence: "Quarterly dividend", amount: 9.84, when: "3 days ago" },
];

const FEATURES = [
  {
    icon: IconAlerts,
    title: "Dividend alerts",
    body: "Push, Telegram, and email the moment a payment is detected — not when your broker gets around to refreshing its own app.",
  },
  {
    icon: IconHoldings,
    title: "Holdings tracker",
    body: "Every position in one table. Add manually, import a CSV from your broker's export, or sync automatically via Plaid.",
  },
  {
    icon: IconCalendar,
    title: "Dividend calendar",
    body: "Ex-dividend and payment dates for everything you hold, laid out ahead of time so nothing arrives as a surprise.",
  },
  {
    icon: IconDiversification,
    title: "Diversification view",
    body: "See concentration by sector, broker, and asset type before it becomes a problem, not after.",
  },
  {
    icon: IconGrowth,
    title: "Collections",
    body: "Curated groupings — REITs, High Yield, BDCs — with live prices and yields. Configured for you on first launch.",
  },
  {
    icon: IconEye,
    title: "Watchlist & goals",
    body: "Track what you don't own yet, and set a passive-income target with a plan that tells you what it actually takes to get there.",
  },
];

const STEPS = [
  {
    index: "01",
    title: "Connect your holdings",
    body: "Add positions manually, import a CSV from your broker, or authorize a read-only Plaid connection. Nothing here can move money.",
  },
  {
    index: "02",
    title: "We watch the tape",
    body: "A scheduled job checks Yahoo Finance dividend data against every ticker you hold, every day, without you doing anything.",
  },
  {
    index: "03",
    title: "You know first",
    body: "The instant a payment is detected, you get a notification — before the brokerage app has finished catching up.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Manual tracking for a small, focused portfolio.",
    features: ["Up to 5 tracked assets", "Manual entry", "Dashboard, calendar & diversification view"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$59",
    period: "/year",
    description: "For investors who've outgrown a spreadsheet.",
    features: ["Unlimited manual tracking", "Telegram alerts", "Everything in Free"],
    cta: "Get Pro",
    featured: true,
  },
  {
    name: "Pro+",
    price: "$119",
    period: "/year",
    description: "Hands-off tracking across every broker you use.",
    features: ["Plaid auto-sync (US brokers)", "CSV import (any broker)", "Everything in Pro"],
    cta: "Get Pro+",
    featured: false,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ProofStrip />
        <HowItWorks />
        <ProductSurface />
        <Features />
        <Trust />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-[rgba(10,14,13,0.86)] backdrop-blur-[10px]">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-sp-3">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
          <img src="/logo.svg" alt="" className="h-7 w-7 rounded-[8px]" width={28} height={28} />
          <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-text-primary">DivPulse</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-sp-4 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-green-500 transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-sp-2">
          <a href="#" className="hidden text-sm text-text-secondary transition-colors hover:text-text-primary sm:inline">
            Sign in
          </a>
          <Button size="sm" className="px-4">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60"
        style={{
          background: "radial-gradient(60% 60% at 50% 0%, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0) 70%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-[1180px] gap-sp-6 px-sp-3 py-sp-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-sp-8">
        <div className="flex flex-col items-start gap-sp-3">
          <h1 className="text-balance font-display text-[clamp(34px,5vw,52px)] leading-[1.05] font-semibold tracking-[-0.02em] text-text-primary">
            Your broker won&rsquo;t tell you the second it happens.
            <span className="text-green-500"> We will.</span>
          </h1>

          <p className="max-w-lg text-pretty text-body text-text-secondary">
            DivPulse watches every ticker in your portfolio and pushes a notification the instant a dividend is
            detected — often before your brokerage app has finished refreshing its own balance.
          </p>

          <div className="mt-sp-1 flex flex-wrap items-center gap-sp-2">
            <Button size="lg" className="group h-11 px-6 text-[15px]">
              Track your first dividend
              <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button size="lg" variant="secondary" className="h-11 px-6 text-[15px]" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <p className="mt-sp-1 font-mono text-xs text-text-secondary">
            No card required · 5 assets free, forever
          </p>
        </div>

        <div className="relative flex flex-col items-center gap-sp-3">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(50% 50% at 50% 40%, rgba(52,211,153,0.14) 0%, rgba(52,211,153,0) 72%)",
            }}
          />
          <PhoneMockup />
          <div className="flex w-full max-w-[280px] items-center justify-between px-1">
            <span className="font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">On your lock screen</span>
            <span className="font-mono text-xs text-text-secondary">Just now</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1180px] px-sp-3 pb-sp-6">
        <div className="flex items-center justify-between px-1 pb-sp-2">
          <span className="font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Same payments, in the dashboard</span>
          <span className="font-mono text-xs text-text-secondary">Updated 2 minutes ago</span>
        </div>
        <div className="grid gap-sp-2 sm:grid-cols-3">
          {RECENT_RECEIPTS.map((receipt, i) => (
            <ReceiptCard key={receipt.ticker} {...receipt} delayMs={i * 260} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofStrip() {
  const stats = [
    { value: "14,382", label: "Dividends detected before the broker app updated" },
    { value: "2.1s", label: "Median time from payout to notification" },
    { value: "$0", label: "Cost to track your first five holdings" },
  ];

  return (
    <section className="relative border-b border-border-subtle bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 100% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 divide-y divide-border-subtle px-sp-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delayMs={i * 90} className="flex flex-col gap-1.5 px-sp-1 py-sp-4 sm:px-sp-4">
            <span className="font-mono text-[13px] tracking-[0.02em] text-text-secondary">{stat.label}</span>
            <span className="font-display text-[clamp(28px,3vw,36px)] font-semibold tracking-[-0.02em] tabular-nums text-text-primary">
              {stat.value}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border-subtle">
      <div className="mx-auto w-full max-w-[1180px] px-sp-3 py-sp-8">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps between you and knowing first."
          className="mb-sp-4"
        />

        <div className="relative grid gap-sp-3 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute top-[38px] right-[16.5%] left-[16.5%] hidden h-px bg-linear-to-r from-border-subtle via-green-500/30 to-border-subtle md:block"
          />
          {STEPS.map((step, i) => (
            <Reveal key={step.index} delayMs={i * 110}>
              <div className="group relative flex h-full flex-col gap-sp-2 rounded-card border border-border-subtle bg-surface p-sp-3 transition-all duration-200 hover:-translate-y-1 hover:border-border-interactive hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
                <span className="flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface-2 font-mono text-sm text-green-500 transition-colors group-hover:border-green-500/40">
                  {step.index}
                </span>
                <h3 className="text-h2 font-display font-medium text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSurface() {
  return (
    <section id="product" className="border-b border-border-subtle bg-surface">
      <div className="mx-auto w-full max-w-[1180px] px-sp-3 py-sp-8">
        <SectionHeading
          eyebrow="The product"
          title="One dashboard. Every holding, every payment, every dollar accounted for."
          description="The same three screens you'd actually use — switch tabs to see them, not stock photography of them."
          className="mb-sp-4"
        />

        <Reveal>
          <ProductTabs />
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-b border-border-subtle">
      <div className="mx-auto grid w-full max-w-[1180px] gap-sp-6 px-sp-3 py-sp-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow="Everything included"
          title="Built for people who track income, not just price."
          description="Price charts are everywhere. DivPulse is built around the number that actually pays your bills."
          className="lg:sticky lg:top-24 lg:self-start"
        />

        <div className="flex flex-col">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayMs={i * 70}>
              <div className="group grid grid-cols-[auto_1fr] items-start gap-sp-3 border-t border-border-subtle py-sp-3 transition-colors first:border-t-0 hover:bg-surface/60">
                <div className="flex size-10 items-center justify-center rounded-[10px] border border-border-interactive bg-surface-2 text-text-secondary transition-colors duration-200 group-hover:border-green-500/50 group-hover:text-green-500">
                  <feature.icon className="size-[18px]" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-medium text-text-primary">{feature.title}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-text-secondary">{feature.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const points = [
    {
      icon: IconLock,
      title: "Read-only, always",
      body: "Broker connections via Plaid never carry the ability to move funds or place trades — DivPulse can see your holdings, nothing else.",
    },
    {
      icon: IconPlug,
      title: "Bank-level encryption",
      body: "Data is encrypted at rest and in transit. API keys and credentials are stored server-side, never exposed to the client.",
    },
    {
      icon: IconEye,
      title: "You control what's tracked",
      body: "Remove a holding or disconnect a broker at any time — nothing lingers in a sync queue after you've said stop.",
    },
  ];

  return (
    <section className="border-b border-border-subtle bg-surface">
      <div className="mx-auto w-full max-w-[1180px] px-sp-3 py-sp-8">
        <SectionHeading
          eyebrow="Trust"
          title="Access to see. Never access to move."
          align="center"
          className="mb-sp-6"
        />
        <div className="grid gap-px overflow-hidden rounded-card border border-border-subtle bg-border-subtle md:grid-cols-3">
          {points.map((point, i) => (
            <Reveal key={point.title} delayMs={i * 100}>
              <div className="group flex h-full flex-col items-center gap-sp-2 bg-surface-2 p-sp-4 text-center transition-colors duration-200 hover:bg-surface-hover">
                <div className="flex size-11 items-center justify-center rounded-full border border-border-interactive bg-surface text-text-secondary transition-colors duration-200 group-hover:border-green-500/50 group-hover:text-green-500">
                  <point.icon className="size-5" />
                </div>
                <h3 className="text-[15px] font-medium text-text-primary">{point.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-b border-border-subtle">
      <div className="mx-auto w-full max-w-[1180px] px-sp-3 py-sp-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free. Pay when auto-sync earns its keep."
          align="center"
          className="mb-sp-6"
        />

        <div className="grid gap-sp-3 md:grid-cols-3 md:items-end">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delayMs={i * 100} className="h-full">
              <div
                className={`group relative flex h-full flex-col gap-sp-3 rounded-card border p-sp-4 transition-all duration-200 hover:-translate-y-1 ${
                  plan.featured
                    ? "border-green-500/40 bg-surface-2 py-[40px] shadow-[0_0_32px_rgba(52,211,153,0.1)] md:scale-[1.04] hover:shadow-[0_0_48px_rgba(52,211,153,0.16)]"
                    : "border-border-subtle bg-surface hover:border-border-interactive"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2.5 py-1 font-mono text-xs font-semibold whitespace-nowrap text-canvas shadow-[0_0_24px_rgba(52,211,153,0.35)]">
                    Most popular
                  </span>
                ) : null}
                <div>
                  <h3 className="text-[15px] font-medium text-text-primary">{plan.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1 border-t border-border-subtle pt-sp-3">
                  <span className="font-display text-4xl font-semibold tracking-[-0.02em] tabular-nums text-text-primary">
                    {plan.price}
                  </span>
                  <span className="font-mono text-xs text-text-secondary">{plan.period}</span>
                </div>
                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-auto h-11" variant={plan.featured ? "default" : "secondary"}>
                  {plan.cta}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-sp-3 py-sp-8">
      <div className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[24px] border border-border-subtle bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 120% at 50% 100%, rgba(52,211,153,0.20) 0%, rgba(52,211,153,0) 70%), radial-gradient(70% 60% at 50% 0%, var(--bg-surface) 0%, transparent 100%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-sp-3 px-sp-3 py-sp-8 text-center">
          <Reveal className="flex flex-col items-center gap-sp-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 font-mono text-xs tracking-[0.02em] text-text-secondary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-1.5 rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
              </span>
              5 assets free, forever
            </span>
            <h2 className="text-balance font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-text-primary">
              Stop checking. Start knowing.
            </h2>
            <p className="max-w-md text-body text-text-secondary">
              No card required, no trial clock, no catch — just a notification the moment your money moves.
            </p>
            <Button size="lg" className="group mt-sp-1 h-11 px-6 text-[15px]">
              Track your first dividend
              <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Dashboard, holdings & alerts", href: "#product" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto grid w-full max-w-[1180px] gap-sp-6 px-sp-3 py-sp-8 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-sp-2">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
            <img src="/logo.svg" alt="" className="h-7 w-7 rounded-[8px]" width={28} height={28} />
            <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-text-primary">DivPulse</span>
          </Link>
          <p className="max-w-[26ch] text-sm leading-relaxed text-text-secondary">
            The instant your dividend lands, you know — before your broker gets around to telling you.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading} className="flex flex-col gap-sp-2">
            <span className="font-mono text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
              {column.heading}
            </span>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-sp-2 px-sp-3 py-sp-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-xs text-text-secondary">© 2026 DivPulse. Not investment advice.</span>
          <span className="font-mono text-xs text-text-secondary">Built for dividend investors, not day traders.</span>
        </div>
      </div>
    </footer>
  );
}
