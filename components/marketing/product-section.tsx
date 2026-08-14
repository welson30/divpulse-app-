import { Reveal } from "@/components/marketing/reveal";

const FEATURES = [
  {
    label: "Portfolio Performance",
    icon: "/marketing/product/icon-portfolio-performance.svg",
    active: true,
  },
  {
    label: "Passive Income Tracking",
    icon: "/marketing/product/icon-passive-income.svg",
    active: false,
  },
  {
    label: "Portfolio Allocation",
    icon: "/marketing/product/icon-portfolio-allocation.svg",
    active: false,
  },
  {
    label: "Sector Allocation",
    icon: "/marketing/product/icon-sector-allocation.svg",
    active: false,
  },
  {
    label: "Financial Freedom Goals",
    icon: "/marketing/product/icon-freedom-goals.svg",
    active: false,
  },
  {
    label: "Smart Watchlists",
    icon: "/marketing/product/icon-watchlists.svg",
    active: false,
  },
  {
    label: "AI Advisor",
    icon: "/marketing/product/icon-ai-advisor.svg",
    active: false,
  },
  {
    label: "Dividend Calendar",
    icon: "/marketing/product/icon-calendar.svg",
    active: false,
  },
  {
    label: "Real-Time Alerts",
    icon: "/marketing/product/icon-alerts.svg",
    active: false,
  },
] as const;

/**
 * Figma Homepage section 1:752 — Product / investment dashboard (1440 × 1038.54).
 * Shell matches header/templates: 1440 → px-60 → 1320 → px-12 (content at 108).
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function ProductSection() {
  return (
    <section
      id="product"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="product-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 min-[1200px]:gap-10 min-[1200px]:px-12">
          <Reveal className="flex w-full max-w-[720px] flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
              <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
              Product
            </div>

            <h2
              id="product-heading"
              className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
            >
              Your complete investment{" "}
              <br className="hidden min-[1200px]:block" />
              dashboard
            </h2>

            <p className="m-0 max-w-[640px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
              Every number you need to track passive income, from portfolio value to your
              next confirmed payment.
            </p>
          </Reveal>

          {/* Dashboard + feature list share one row; list stretches to dashboard height */}
          <Reveal
            delayMs={80}
            className="flex w-full flex-col gap-6 min-[1200px]:flex-row min-[1200px]:items-stretch min-[1200px]:justify-between min-[1200px]:gap-6"
          >
            <div className="relative w-full min-w-0 overflow-hidden rounded-[18px] border border-[#2e343b] bg-[#121417] shadow-[0px_40px_90px_-30px_rgba(0,0,0,0.75)] min-[1200px]:w-[841px] min-[1200px]:shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/product/dashboard.png"
                alt="PaidPrime investment dashboard showing portfolio value, income, and performance charts"
                width={842}
                height={653}
                className="block h-auto w-full select-none"
                draggable={false}
              />
            </div>

            <ul className="m-0 flex w-full list-none flex-col overflow-hidden rounded-[18px] border border-[#2e343b] p-0 min-[1200px]:w-[358px] min-[1200px]:shrink-0 min-[1200px]:self-stretch">
              {FEATURES.map((feature, index) => (
                <li
                  key={feature.label}
                  className={`flex min-h-0 flex-1 items-center gap-3 bg-[#121417] px-4 py-3.5 min-[1200px]:py-0 ${
                    index < FEATURES.length - 1 ? "border-b border-[#22262c]" : ""
                  }`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] border ${
                      feature.active
                        ? "border-[rgba(76,130,247,0.45)] bg-[#16233d]"
                        : "border-[#2e343b] bg-[#16191d]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={feature.icon}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4"
                    />
                  </div>
                  <span className="text-[15px] leading-[22.28px] font-medium text-[#f2f4f7] min-[1200px]:text-[16px]">
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
