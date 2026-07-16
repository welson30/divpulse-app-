"use client";

import { useState, type ReactNode } from "react";
import { ReceiptCard } from "@/components/marketing/receipt-card";
import { DividendCalendarChart, DiversificationRing } from "@/components/marketing/mini-charts";
import { HoldingsPreviewTable } from "@/components/marketing/holdings-preview-table";
import { IconAlerts, IconBell, IconCheck } from "@/components/marketing/icons";
import { cn } from "@/lib/utils";

const LIVE_TABS = [
  { key: "for-you", label: "For You" },
  { key: "holdings", label: "Holdings" },
  { key: "dividends", label: "Dividends" },
  { key: "calendar", label: "Calendar" },
  { key: "collections", label: "Collections" },
  { key: "diversification", label: "Diversification" },
  { key: "payments", label: "Payments" },
] as const;

type TabKey = (typeof LIVE_TABS)[number]["key"];

const WATCHLIST = [
  { ticker: "JEPI", name: "JPMorgan Equity Premium", price: "55.71", change: "+0.4%", positive: true },
  { ticker: "SCHD", name: "Schwab US Dividend ETF", price: "82.65", change: "+1.2%", positive: true },
  { ticker: "O", name: "Realty Income Corp", price: "54.58", change: "−0.3%", positive: false },
  { ticker: "XYLD", name: "Global X Covered Call", price: "48.70", change: "+0.4%", positive: true },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", price: "412.40", change: "−0.1%", positive: false },
  { ticker: "ADC", name: "Agree Realty Corp", price: "75.20", change: "+0.6%", positive: true },
];

/**
 * Full app shell — top nav + utility bar + watchlist rail, matching the
 * real product's chrome from Prototype/index.html — rather than a bare
 * marketing-only tab switcher. All seven tabs (For You, Holdings,
 * Dividends, Calendar, Collections, Diversification, Payments) are live
 * and clickable, each with real content sourced from the prototype/PRD.
 */
export function ProductTabs() {
  const [active, setActive] = useState<TabKey>("for-you");

  return (
    <div className="overflow-hidden rounded-card border border-border-subtle bg-surface shadow-[0_24px_64px_-32px_rgba(0,0,0,0.6)]">
      {/* utility bar */}
      <div className="flex items-center justify-between gap-sp-2 border-b border-border-subtle bg-surface-2 px-sp-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
          <img src="/logo.svg" alt="" className="h-5 w-5 rounded-[6px]" width={20} height={20} />
          <span className="font-display text-[13px] font-semibold tracking-[-0.01em] text-text-primary">DivPulse</span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-border-subtle bg-surface p-0.5 sm:flex">
          {["USD", "BRL", "MXN"].map((cur, i) => (
            <span
              key={cur}
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                i === 0 ? "bg-green-500 text-canvas" : "text-text-secondary",
              )}
            >
              {cur}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-7 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary"
          >
            <IconBell className="size-3.5" />
            <span aria-hidden className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-green-500" />
          </button>
          <div className="flex size-7 items-center justify-center rounded-full border border-green-500/30 bg-[rgba(52,211,153,0.12)] font-mono text-[10px] font-bold text-green-500">
            AX
          </div>
        </div>
      </div>

      {/* tab nav */}
      <div className="flex items-center gap-sp-3 overflow-x-auto border-b border-border-subtle px-sp-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LIVE_TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={cn(
                "relative shrink-0 py-3 font-sans text-[13px] font-medium whitespace-nowrap transition-colors",
                isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.label}
              <span
                aria-hidden
                className={cn(
                  "absolute right-0 -bottom-px left-0 h-[2px] rounded-full bg-green-500 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* body: main panel + watchlist rail */}
      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        <div className="relative p-sp-3">
          <PanelSwitch active={active} panel="for-you">
            <ForYouPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="holdings">
            <HoldingsPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="dividends">
            <DividendsPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="calendar">
            <CalendarPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="collections">
            <CollectionsPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="diversification">
            <DiversificationPanel />
          </PanelSwitch>
          <PanelSwitch active={active} panel="payments">
            <PaymentsPanel />
          </PanelSwitch>
        </div>

        <aside className="border-t border-border-subtle bg-surface-2 p-sp-3 lg:border-t-0 lg:border-l">
          <span className="mb-sp-2 block font-mono text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
            Watchlist
          </span>
          <div className="flex flex-col gap-1">
            {WATCHLIST.map((w) => (
              <div key={w.ticker} className="flex items-center justify-between gap-2 rounded-[8px] px-1.5 py-2 transition-colors hover:bg-surface-hover">
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-semibold text-text-primary">{w.ticker}</div>
                  <div className="truncate text-[11px] text-text-secondary">{w.name}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] tabular-nums text-text-primary">${w.price}</div>
                  <div className={cn("font-mono text-[11px] tabular-nums", w.positive ? "text-green-500" : "text-red-500")}>
                    {w.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PanelSwitch({ active, panel, children }: { active: TabKey; panel: TabKey; children: ReactNode }) {
  const isActive = active === panel;
  return (
    <div
      className={cn(
        "transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
        isActive
          ? "relative translate-y-0 opacity-100 blur-none"
          : "pointer-events-none absolute inset-0 -z-10 translate-y-1.5 opacity-0 blur-[2px]",
      )}
      aria-hidden={!isActive}
      inert={!isActive}
    >
      {children}
    </div>
  );
}

function ForYouPanel() {
  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <h3 className="text-h2 font-display font-medium text-text-primary">Good morning, Alex</h3>
        <p className="text-sm text-text-secondary">
          Thursday, July 3 · <span className="text-green-500">2 dividends received today</span>
        </p>
      </div>

      <div className="grid gap-sp-2 sm:grid-cols-2">
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <span className="mb-1 block text-xs text-text-secondary">Portfolio value</span>
          <div className="font-display text-2xl font-semibold tabular-nums text-text-primary">$84,230</div>
          <div className="mt-1 font-mono text-xs text-green-500">+$3,041 · +3.74% YTD</div>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <span className="mb-1 block text-xs text-text-secondary">Annual dividend income</span>
          <div className="font-display text-2xl font-semibold tabular-nums text-text-primary">$5,220</div>
          <div className="mt-1 font-mono text-xs text-green-500">+$412 this month · 5.84% yield</div>
        </div>
      </div>

      <div className="rounded-card border border-green-500/25 bg-[rgba(52,211,153,0.08)] p-sp-3">
        <div className="mb-1 flex items-center gap-2">
          <IconAlerts className="size-4 text-green-500" />
          <span className="text-sm font-semibold text-green-500">Push notifications active</span>
        </div>
        <p className="text-xs text-text-secondary">You know the moment a dividend lands — Telegram connected.</p>
      </div>

      <div className="flex flex-col gap-sp-2">
        <span className="text-sm font-medium text-text-secondary">Today&rsquo;s payments</span>
        <div className="grid gap-sp-2 sm:grid-cols-2">
          <ReceiptCard ticker="JEPI" name="JPMorgan Equity Premium" cadence="Fidelity" amount={61.2} when="9:02 AM" />
          <ReceiptCard ticker="O" name="Realty Income Corp" cadence="Schwab" amount={18.44} when="9:02 AM" delayMs={120} />
        </div>
      </div>
    </div>
  );
}

function HoldingsPanel() {
  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap items-center justify-between gap-sp-2">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h3 className="text-h2 font-display font-medium text-text-primary">Holdings</h3>
        </div>
        <div className="flex items-center gap-2 rounded-control border border-border-interactive bg-surface-2 px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4 text-text-secondary" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="font-sans text-sm text-text-secondary">Search ticker or company</span>
        </div>
      </div>
      <HoldingsPreviewTable />
    </div>
  );
}

function DividendsPanel() {
  const earners = [
    { ticker: "XYLD", yield: "10.31%", amount: "$879/yr" },
    { ticker: "JEPI", yield: "7.21%", amount: "$843/yr" },
    { ticker: "SCHD", yield: "3.52%", amount: "$988/yr" },
  ];

  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <span className="mb-1 block text-xs text-text-secondary">Annual dividend income</span>
        <div className="font-display text-3xl font-semibold tracking-[-0.01em] tabular-nums text-text-primary">$5,220</div>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-border-subtle bg-border-subtle">
        {[
          { label: "Per day", value: "$14.30" },
          { label: "Per month", value: "$435" },
          { label: "Per year", value: "$5,220" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-2 p-sp-2 text-center">
            <div className="text-[11px] text-text-secondary">{s.label}</div>
            <div className="mt-1 font-mono text-lg font-semibold text-green-500">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-sp-3 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <h4 className="mb-sp-2 text-sm font-medium text-text-secondary">Monthly income 2026</h4>
          <DividendCalendarChart />
        </div>
        <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <h4 className="mb-sp-2 text-sm font-medium text-text-secondary">Top earners</h4>
          <div className="flex flex-col gap-2">
            {earners.map((e) => (
              <div key={e.ticker} className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[13px] font-semibold text-text-primary">{e.ticker}</div>
                  <div className="text-[11px] text-text-secondary">{e.yield}</div>
                </div>
                <div className="font-mono text-sm font-semibold text-green-500">{e.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarPanel() {
  const days = [
    { day: 1, event: "ADC ex-date", kind: "ex" },
    { day: 2, event: "JEPI $61.20", kind: "pay" },
    { day: 3, event: null, kind: "today" },
    { day: 7, event: "ADC $14.82", kind: "pay" },
    { day: 9, event: "SCHD ex", kind: "ex" },
    { day: 10, event: "XYLD $45", kind: "pay" },
    { day: 17, event: "JEPI $61.20", kind: "pay" },
    { day: 21, event: "O $18.44", kind: "pay" },
    { day: 24, event: "JEPI ex", kind: "ex" },
    { day: 28, event: "SCHD $88", kind: "pay" },
    { day: 31, event: "VOO $21", kind: "pay" },
  ];
  const dayMap = new Map(days.map((d) => [d.day, d]));

  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <h3 className="text-h2 font-display font-medium text-text-primary">July 2026</h3>
        <p className="text-sm text-text-secondary">4 dividend payments · 2 ex-dates</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-text-secondary">
            {d}
          </div>
        ))}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: 31 }).map((_, i) => {
          const day = i + 1;
          const cell = dayMap.get(day);
          const isInert = !cell?.event && cell?.kind !== "today";
          return (
            <div
              key={day}
              className={cn(
                "group relative flex min-h-[46px] cursor-default flex-col gap-0.5 rounded-[6px] border p-1 text-[10px] transition-all duration-150 ease-out",
                !isInert && "hover:z-10 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]",
                cell?.kind === "today"
                  ? "border-green-500 hover:shadow-[0_0_0_1px_var(--green-500),0_8px_20px_-8px_rgba(52,211,153,0.35)]"
                  : cell?.kind === "pay"
                    ? "border-green-500/30 bg-[rgba(52,211,153,0.08)] hover:border-green-500/60 hover:bg-[rgba(52,211,153,0.14)]"
                    : cell?.kind === "ex"
                      ? "border-warning/20 bg-[rgba(251,191,36,0.06)] hover:border-warning/50 hover:bg-[rgba(251,191,36,0.12)]"
                      : "border-border-subtle bg-surface-2 hover:border-border-interactive",
              )}
            >
              <span className={cn("font-mono", cell?.kind === "today" ? "font-bold text-green-500" : "text-text-secondary")}>
                {day}
              </span>
              {cell?.event ? (
                <span
                  className={cn(
                    "truncate rounded-[3px] px-1 py-0.5 text-[9px] transition-colors",
                    cell.kind === "pay" ? "bg-green-900/60 text-green-500" : "bg-warning/15 text-warning",
                  )}
                >
                  {cell.event}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-sp-3 border-t border-border-subtle pt-sp-2">
        <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span aria-hidden className="size-2 rounded-[2px] bg-green-500/40" />
          Payment
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span aria-hidden className="size-2 rounded-[2px] bg-warning/40" />
          Ex-date
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span aria-hidden className="size-2 rounded-[2px] border border-green-500" />
          Today
        </span>
      </div>
    </div>
  );
}

const COLLECTION_CATEGORIES = ["Dividends", "REITs", "High Yield", "Covered Calls", "BDCs", "YieldMax", "Technology"];

const COLLECTION_ASSETS = [
  { ticker: "SCHD", name: "Schwab US Dividend ETF", yield: "3.52%", price: "82.65", inPortfolio: false },
  { ticker: "VYM", name: "Vanguard High Dividend Yield", yield: "2.90%", price: "124.30", inPortfolio: false },
  { ticker: "O", name: "Realty Income Corp", yield: "5.50%", price: "54.58", inPortfolio: true },
  { ticker: "JNJ", name: "Johnson & Johnson", yield: "3.10%", price: "159.20", inPortfolio: false },
];

function CollectionsPanel() {
  const [activeCategory, setActiveCategory] = useState(COLLECTION_CATEGORIES[0]);

  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <h3 className="text-h2 font-display font-medium text-text-primary">Collections</h3>
        <p className="text-sm text-text-secondary">Auto-populated by category — tap any to explore.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COLLECTION_CATEGORIES.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors",
                isActive
                  ? "border-green-500/50 bg-[rgba(52,211,153,0.12)] text-green-500"
                  : "border-border-subtle text-text-secondary hover:border-border-interactive hover:text-text-primary",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="grid gap-sp-2 sm:grid-cols-2">
        {COLLECTION_ASSETS.map((asset) => (
          <div
            key={asset.ticker}
            className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-2 p-sp-2 transition-colors hover:border-border-interactive"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[13px] font-semibold text-text-primary">{asset.ticker}</div>
              <div className="truncate text-[11px] text-text-secondary">{asset.name}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-semibold text-warning">{asset.yield}</div>
              <div className="font-mono text-[13px] tabular-nums text-text-primary">${asset.price}</div>
            </div>
            <button
              type="button"
              disabled={asset.inPortfolio}
              className={cn(
                "shrink-0 rounded-control px-2.5 py-1.5 font-sans text-[11px] font-semibold transition-colors",
                asset.inPortfolio
                  ? "border border-green-500/30 text-green-500"
                  : "bg-green-500 text-canvas hover:bg-green-600",
              )}
            >
              {asset.inPortfolio ? "In portfolio" : "+ Add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIVERSIFICATION_DIMENSIONS = ["Asset class", "Sector", "Broker", "Country"] as const;

const DIVERSIFICATION_BREAKDOWNS: Record<(typeof DIVERSIFICATION_DIMENSIONS)[number], { label: string; percent: number; value: string }[]> = {
  "Asset class": [
    { label: "ETFs", percent: 61, value: "$51,380" },
    { label: "REITs", percent: 18, value: "$15,161" },
    { label: "Stocks", percent: 17, value: "$14,319" },
    { label: "Cash", percent: 4, value: "$3,369" },
  ],
  Sector: [
    { label: "Consumer staples", percent: 34, value: "$28,638" },
    { label: "Real estate", percent: 22, value: "$18,531" },
    { label: "Technology", percent: 21, value: "$17,688" },
    { label: "Healthcare", percent: 23, value: "$19,373" },
  ],
  Broker: [
    { label: "Fidelity", percent: 47, value: "$39,588" },
    { label: "Schwab", percent: 31, value: "$26,111" },
    { label: "IBKR", percent: 15, value: "$12,635" },
    { label: "XP Investimentos", percent: 7, value: "$5,896" },
  ],
  Country: [
    { label: "United States", percent: 89, value: "$74,965" },
    { label: "Brazil", percent: 7, value: "$5,896" },
    { label: "Other", percent: 4, value: "$3,369" },
  ],
};

function DiversificationPanel() {
  const [dimension, setDimension] = useState<(typeof DIVERSIFICATION_DIMENSIONS)[number]>("Asset class");
  const breakdown = DIVERSIFICATION_BREAKDOWNS[dimension];
  const top = breakdown[0];

  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <h3 className="text-h2 font-display font-medium text-text-primary">Diversification</h3>
        <p className="text-sm text-text-secondary">Portfolio breakdown by four dimensions.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DIVERSIFICATION_DIMENSIONS.map((dim) => {
          const isActive = dim === dimension;
          return (
            <button
              key={dim}
              type="button"
              onClick={() => setDimension(dim)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors",
                isActive
                  ? "border-green-500/50 bg-[rgba(52,211,153,0.12)] text-green-500"
                  : "border-border-subtle text-text-secondary hover:border-border-interactive hover:text-text-primary",
              )}
            >
              {dim}
            </button>
          );
        })}
      </div>

      <div className="grid gap-sp-3 md:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-card border border-border-subtle bg-surface-2 p-sp-3">
          <DiversificationRing label={top.label} percent={top.percent} />
        </div>
        <div className="flex flex-col gap-sp-2">
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
            <span className="mb-sp-2 block font-mono text-xs font-semibold tracking-[0.06em] text-text-secondary uppercase">
              Breakdown
            </span>
            <div className="flex flex-col gap-2">
              {breakdown.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-secondary">{row.value}</span>
                    <span className="font-mono text-sm font-semibold text-text-primary">{row.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-card border border-green-500/25 bg-[rgba(52,211,153,0.08)] p-sp-3">
            <span className="mb-1 block text-xs font-semibold text-text-secondary uppercase">AI insight</span>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              Your portfolio is <span className="font-semibold text-green-500">overweight in {top.label.toLowerCase()} ({top.percent}%)</span>.
              Adding a few more names outside this bucket could improve diversification while keeping yield steady.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_HISTORY = [
  { ticker: "JEPI", name: "JPMorgan Equity Premium", broker: "Fidelity", amount: 61.2, when: "Today, 9:02 AM", status: "confirmed" as const },
  { ticker: "O", name: "Realty Income Corp", broker: "Schwab", amount: 18.44, when: "Today, 9:02 AM", status: "confirmed" as const },
  { ticker: "SCHD", name: "Schwab US Dividend ETF", broker: "Fidelity", amount: 85.34, when: "Yesterday", status: "confirmed" as const },
  { ticker: "ADC", name: "Agree Realty Corp", broker: "IBKR", amount: 14.82, when: "Jul 7 (expected)", status: "pending" as const },
];

function PaymentsPanel() {
  return (
    <div className="flex flex-col gap-sp-3">
      <div>
        <h3 className="text-h2 font-display font-medium text-text-primary">Payments</h3>
        <p className="text-sm text-text-secondary">Broker-confirmed payouts — matched against Yahoo Finance detection.</p>
      </div>

      <div className="flex flex-col gap-sp-2">
        {PAYMENT_HISTORY.map((payment) => (
          <div
            key={payment.ticker + payment.when}
            className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-2 p-sp-2 transition-colors hover:border-border-interactive"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle bg-surface font-mono text-[11px] font-semibold text-text-secondary">
              {payment.ticker}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-text-primary">{payment.name}</div>
              <div className="text-[11px] text-text-secondary">
                {payment.broker} · {payment.when}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-sm font-semibold tabular-nums text-green-500">+${payment.amount.toFixed(2)}</div>
              <div
                className={cn(
                  "mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-medium",
                  payment.status === "confirmed" ? "text-green-500" : "text-warning",
                )}
              >
                {payment.status === "confirmed" ? (
                  <>
                    <IconCheck className="size-3" />
                    Confirmed
                  </>
                ) : (
                  "Pending"
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
