import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Live value, income and yield in one glance",
    icon: "/marketing/portfolio/icon-value.svg",
  },
  {
    label: "Monthly income trend, automatically tracked",
    icon: "/marketing/portfolio/icon-trend.svg",
  },
  {
    label: "Per-holding breakdown with annualized income",
    icon: "/marketing/portfolio/icon-holdings.svg",
  },
] as const;

const HOLDINGS = [
  { ticker: "JEPI", yield: "7.41%", value: "$7,342.10" },
  { ticker: "SCHD", yield: "3.62%", value: "$8,556.00" },
  { ticker: "O", yield: "5.45%", value: "$4,058.10" },
] as const;

/**
 * Figma Homepage section 1:1346 — Portfolio overview.
 * Card left (tilted +1.4°), copy right. Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function PortfolioOverviewSection() {
  return (
    <section
      id="portfolio-overview"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="portfolio-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col-reverse items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Portfolio card — Figma +1.4° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[1.4deg]">
                <div className="relative flex w-full flex-col gap-[11.8px] rounded-[18px] border border-[#2e343b] bg-[#121417] px-5 pt-[18.8px] pb-[19.6px] shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                    Portfolio overview
                  </p>

                  <div className="flex gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] border border-[#22262c] bg-[#16191d] p-[9.8px]">
                      <span className="text-[9px] leading-[14.85px] tracking-[1.08px] text-[#6c737f] uppercase">
                        Value
                      </span>
                      <span className="text-[16px] leading-[26.4px] font-medium tracking-[-0.32px] text-[#f2f4f7]">
                        $142,880
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] border border-[#22262c] bg-[#16191d] p-[9.8px]">
                      <span className="text-[9px] leading-[14.85px] tracking-[1.08px] text-[#6c737f] uppercase">
                        Today
                      </span>
                      <span className="text-[16px] leading-[26.4px] font-medium tracking-[-0.32px] text-[#3fbf87]">
                        +$61.20
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-[#22262c] p-[7.8px]" aria-hidden>
                    <div className="relative h-[110px] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/marketing/portfolio/chart-fill.svg"
                        alt=""
                        className="absolute inset-[7.3%_2.22%_0.03%_0] size-full max-w-none"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/marketing/portfolio/chart-line.svg"
                        alt=""
                        className="absolute inset-[15.79%_2.22%_0.03%_0] size-full max-w-none"
                      />
                    </div>
                  </div>

                  <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[10px] border border-[#22262c] p-0">
                    {HOLDINGS.map((row, index) => (
                      <li
                        key={row.ticker}
                        className={`flex items-center justify-between gap-3 px-3 py-[7.5px] ${
                          index < HOLDINGS.length - 1 ? "border-b border-[#22262c]" : ""
                        }`}
                      >
                        <span className="min-w-0 shrink-0 text-[11.5px] leading-[18.98px] text-[#f2f4f7]">
                          {row.ticker}
                        </span>
                        <span className="text-[11.5px] leading-[18.98px] tracking-[-0.23px] text-[#3fbf87]">
                          {row.yield}
                        </span>
                        <span className="text-[11.5px] leading-[18.98px] tracking-[-0.23px] text-[#99a1ac]">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                Portfolio overview
              </div>

              <h2
                id="portfolio-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                Track value and{" "}
                <br className="hidden min-[1200px]:block" />
                income side by side
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Watch your portfolio grow while confirming the passive income compounding
                underneath it.
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
