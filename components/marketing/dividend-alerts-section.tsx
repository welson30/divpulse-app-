import { Reveal } from "@/components/marketing/reveal";
import { StatCountUp } from "@/components/marketing/stat-count-up";

const CHANNELS = [
  {
    title: "Push",
    subtitle: "iOS & Android · instant",
    icon: "/marketing/alerts/push.svg",
    amount: 61.2,
    ticker: "JEPI",
    name: "JPMorgan Equity Premium",
    footer: "Paid by Fidelity · 9:02 AM",
  },
  {
    title: "Telegram",
    subtitle: "Private bot message",
    icon: "/marketing/alerts/telegram.svg",
    amount: 18.44,
    ticker: "O",
    name: "Realty Income",
    footer: "Paid by Schwab · 9:04 AM",
  },
  {
    title: "Email",
    subtitle: "Formatted receipt",
    icon: "/marketing/alerts/email.svg",
    amount: 94.1,
    ticker: "SCHD",
    name: "Schwab US Dividend Equity",
    footer: "Paid by Schwab · 8:41 AM",
  },
] as const;

/**
 * Figma Homepage section 1:411 — Real-time dividend alerts (1440 x 1063.04).
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function DividendAlertsSection() {
  return (
    <section
      id="dividend-alerts"
      className="relative border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="alerts-heading"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8 px-4 py-14 sm:gap-10 sm:px-6 sm:py-16 min-[1200px]:box-border min-[1200px]:gap-16 min-[1200px]:px-[108px] min-[1200px]:py-[128px]">
        <Reveal className="flex w-full max-w-[860px] flex-col items-center gap-4 text-center sm:gap-5 min-[1200px]:gap-[23px]">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#2e343b] bg-[#16191d] px-3.5 py-1.5 text-[11px] font-medium leading-snug tracking-[1.6px] text-[#4c82f7] uppercase sm:gap-2.5 sm:px-[15.8px] sm:pt-[7.2px] sm:pb-[7.8px] sm:text-[13px] sm:leading-[21.45px] sm:tracking-[2.08px]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
            <span className="text-left">Real-time dividend alerts</span>
          </div>

          <h2
            id="alerts-heading"
            className="pp-display m-0 w-full text-[clamp(30px,7vw,48px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
          >
            Your broker never tells you the{" "}
            <br className="hidden min-[1200px]:block" />
            moment you get paid.{" "}
            <br className="hidden min-[1200px]:block" />
            PaidPrime does.
          </h2>

          <p className="m-0 max-w-[840px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
            Receive instant push notifications, Telegram, or email alerts the moment a
            dividend payment is detected—so you&apos;re always the first to know.
          </p>
        </Reveal>

        <Reveal delayMs={80} className="w-full max-w-[1224px]">
          {/*
            Mobile: 1 col · Tablet: 1 col (cards stay readable) · ≥1024: 3 side-by-side
            Avoids awkward 2+1 wrap on mid widths.
          */}
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:gap-5 min-[1024px]:grid-cols-3 min-[1024px]:gap-5 min-[1200px]:gap-6">
            {CHANNELS.map((channel) => (
              <li
                key={channel.title}
                className="flex flex-col gap-6 overflow-hidden rounded-[18px] border border-[#2e343b] bg-[#121417] p-5 sm:gap-7 sm:rounded-[20px] sm:p-6 min-[1200px]:gap-8 min-[1200px]:rounded-[22px] min-[1200px]:p-[31.8px]"
              >
                <div className="flex items-center gap-3.5 sm:gap-5">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(76,130,247,0.3)] bg-[#16233d] sm:size-16 sm:rounded-[16px] min-[1200px]:size-20 min-[1200px]:rounded-[18px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel.icon}
                      alt=""
                      width={44}
                      height={44}
                      className="size-8 sm:size-9 min-[1200px]:size-11"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="pp-display m-0 text-[22px] leading-tight font-semibold tracking-[-0.4px] text-[#f2f4f7] sm:text-[24px] min-[1200px]:text-[26px] min-[1200px]:leading-[42.9px] min-[1200px]:tracking-[-0.52px]">
                      {channel.title}
                    </p>
                    <p className="m-0 text-[14px] leading-snug font-normal text-[#99a1ac] sm:text-[15px] min-[1200px]:leading-[24.75px]">
                      {channel.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-1.5 rounded-[16px] border border-[#22262c] bg-[#16191d] p-4 sm:gap-2 sm:rounded-[18px] sm:p-5 min-[1200px]:p-[23.8px]">
                  <p className="m-0 text-[14px] leading-snug font-normal text-[#99a1ac] sm:text-[15px] min-[1200px]:leading-[24.75px]">
                    Dividend received
                  </p>
                  <p className="m-0 text-[32px] leading-none font-semibold tracking-[-0.6px] text-[#3fbf87] sm:text-[36px] min-[1200px]:text-[40px] min-[1200px]:leading-10 min-[1200px]:tracking-[-0.8px]">
                    <StatCountUp
                      end={channel.amount}
                      prefix="+$"
                      decimals={2}
                      durationMs={1200}
                    />
                  </p>
                  <p className="m-0 pt-1 pb-1.5 text-[14px] leading-snug font-medium sm:pb-2 sm:text-[15px] min-[1200px]:text-[16px] min-[1200px]:leading-[26.4px]">
                    <span className="text-[#f2f4f7]">{channel.ticker}</span>
                    <span className="text-[#6c737f]"> · </span>
                    <span className="text-[#99a1ac]">{channel.name}</span>
                  </p>
                  <div className="border-t border-[#22262c] pt-3 min-[1200px]:pt-[14.8px]">
                    <p className="m-0 text-[13px] leading-snug font-normal text-[#6c737f] sm:text-[14px] min-[1200px]:leading-[23.1px]">
                      {channel.footer}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
