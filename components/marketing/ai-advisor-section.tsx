import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Ask anything about your income in plain language",
    icon: "/marketing/ai-advisor/icon-ask.svg",
  },
  {
    label: "Insights generated nightly from linked accounts",
    icon: "/marketing/ai-advisor/icon-insights.svg",
  },
  {
    label: "Flags concentration and allocation risk early",
    icon: "/marketing/ai-advisor/icon-flags.svg",
  },
] as const;

/**
 * Figma Homepage section 1:1707 — AI Advisor.
 * Copy left, card right (tilted −1.3°). Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function AiAdvisorSection() {
  return (
    <section
      id="ai-advisor"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="ai-advisor-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                AI Advisor
              </div>

              <h2
                id="ai-advisor-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                A second set of eyes{" "}
                <br className="hidden min-[1200px]:block" />
                on every position
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Ask questions in plain language and get answers grounded in your actual
                holdings, not generic market commentary.
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

            {/* AI Advisor card — Figma −1.3° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[-1.3deg]">
                <div className="relative flex w-full flex-col gap-3.5 rounded-[18px] border border-[#2e343b] bg-[#121417] p-5 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#2e343b] bg-[#16233d]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/marketing/ai-advisor/icon-bot.svg"
                        alt=""
                        width={15}
                        height={15}
                        className="size-[15px]"
                      />
                    </div>
                    <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                      AI advisor
                    </p>
                  </div>

                  <p className="m-0 text-[12.5px] leading-[20.31px] text-[#99a1ac]">
                    Your trailing twelve-month income grew{" "}
                    <span className="tracking-[-0.25px] text-[#3fbf87]">+18.6%</span>, driven
                    by reinvested distributions in{" "}
                    <span className="text-[#f2f4f7]">JEPI</span>.
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2.5 rounded-[10px] border border-[#22262c] bg-[#16191d] p-[9.8px]">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#2e343b] bg-[#10261e]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/ai-advisor/icon-tip.svg"
                          alt=""
                          width={12}
                          height={12}
                          className="size-3"
                        />
                      </div>
                      <p className="m-0 text-[11.5px] leading-[15.81px] text-[#99a1ac]">
                        Adding <span className="text-[#f2f4f7]">ADC</span> raises blended yield
                        to <span className="tracking-[-0.23px] text-[#f2f4f7]">4.4%</span>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-[10px] border border-[#22262c] bg-[#16191d] p-[9.8px]">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#2e343b] bg-[#241c10]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/marketing/ai-advisor/icon-warn.svg"
                          alt=""
                          width={12}
                          height={12}
                          className="size-3"
                        />
                      </div>
                      <p className="m-0 text-[11.5px] leading-[15.81px] text-[#99a1ac]">
                        34% of income relies on covered call ETFs — consider capping near 30%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
