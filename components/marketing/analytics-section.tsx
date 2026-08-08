import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Income growth, cash flow and yield trends",
    icon: "/marketing/analytics/icon-growth.svg",
  },
  {
    label: "Monthly and yearly comparisons side by side",
    icon: "/marketing/analytics/icon-compare.svg",
  },
  {
    label: "24-month historical performance at a glance",
    icon: "/marketing/analytics/icon-history.svg",
  },
] as const;

/** Relative bar heights matching Figma monthly income chart */
const MONTHLY_BARS = [48, 44, 55, 51, 50, 64, 51, 46, 62, 52, 49, 68] as const;

/**
 * Figma Homepage section 1:1799 — Analytics.
 * Card left (tilted +1.4°), copy right. Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function AnalyticsSection() {
  return (
    <section
      id="analytics"
      className="relative border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="analytics-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col-reverse items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Analytics grid card — Figma +1.4° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[1.4deg]">
                <div className="relative flex w-full flex-col gap-3 rounded-[18px] border border-[#2e343b] bg-[#121417] px-5 pt-[18.8px] pb-5 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                    Analytics grid
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Income growth */}
                    <div className="flex flex-col rounded-[10px] border border-[#22262c] p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] leading-[16.5px] text-[#99a1ac]">
                          Income growth
                        </span>
                        <span className="text-[10px] leading-[16.5px] tracking-[-0.2px] text-[#3fbf87]">
                          +18.6%
                        </span>
                      </div>
                      <div className="relative h-[70px] w-full overflow-hidden" aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/analytics/growth-fill.svg"
                          alt=""
                          className="absolute inset-[11.5%_4.8%_0_0] size-full max-w-none"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/analytics/growth-line.svg"
                          alt=""
                          className="absolute inset-[12%_4.8%_0_0] size-full max-w-none"
                        />
                      </div>
                    </div>

                    {/* Monthly income */}
                    <div className="flex flex-col rounded-[10px] border border-[#22262c] p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] leading-[16.5px] text-[#99a1ac]">
                          Monthly income
                        </span>
                        <span className="text-[10px] leading-[16.5px] tracking-[-0.2px] text-[#3fbf87]">
                          $5,412
                        </span>
                      </div>
                      <div className="relative flex h-[70px] flex-col" aria-hidden>
                        <div className="flex min-h-0 flex-1 items-end gap-[3px] pl-5">
                          {MONTHLY_BARS.map((h, i) => (
                            <div
                              key={i}
                              className="min-w-0 flex-1 rounded-t-[1px] bg-[#3fbf87]"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="mt-0.5 flex justify-between pl-5 text-[8px] leading-none text-[#6c737f]">
                          <span>Mar</span>
                          <span>Jun</span>
                          <span>Sep</span>
                          <span>Dec</span>
                        </div>
                      </div>
                    </div>

                    {/* Yield trend — full width */}
                    <div className="col-span-2 flex flex-col rounded-[10px] border border-[#22262c] p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] leading-[16.5px] text-[#99a1ac]">
                          Yield trend
                        </span>
                        <span className="text-[10px] leading-[16.5px] tracking-[-0.2px] text-[#f2f4f7]">
                          4.8% current
                        </span>
                      </div>
                      <div className="relative h-16 w-full overflow-hidden" aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/analytics/yield-fill.svg"
                          alt=""
                          className="absolute inset-[12.5%_2.2%_0_0] size-full max-w-none"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/analytics/yield-line.svg"
                          alt=""
                          className="absolute inset-[13%_2.2%_0_0] size-full max-w-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                Analytics
              </div>

              <h2
                id="analytics-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                Every angle on your{" "}
                <br className="hidden min-[1200px]:block" />
                income, in one grid
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Production-grade charting across growth, cash flow, yield and historical
                performance.
              </p>

              <ul className="m-0 flex w-full list-none flex-col gap-3 p-0 pt-2 min-[1200px]:pt-[8.9px]">
                {BULLETS.map((bullet) => (
                  <li key={bullet.label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#2e343b] bg-[#16191d]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bullet.icon}
                        alt=""
                        width={13}
                        height={13}
                        className="size-[13px]"
                      />
                    </div>
                    <span className="pt-0.5 text-[14px] leading-[23.1px] font-normal text-[#99a1ac]">
                      {bullet.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
