import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Confirmed and expected payments, clearly labeled",
    icon: "/marketing/upcoming/icon-confirmed.svg",
  },
  {
    label: "Exact dates, matched to your linked broker",
    icon: "/marketing/upcoming/icon-dates.svg",
  },
  {
    label: "Total expected income, always up to date",
    icon: "/marketing/upcoming/icon-total.svg",
  },
] as const;

const PAYMENTS = [
  {
    ticker: "JEPI",
    date: "Apr 4 · Est.",
    dateIcon: "/marketing/upcoming/icon-cal-1.svg",
    broker: "Fidelity",
    brokerSrc: "/marketing/upcoming/chip-fidelity.png",
    amount: "+$61.20",
    status: "Expected",
    statusClass:
      "border-[rgba(76,130,247,0.3)] bg-[#16233d] text-[#4c82f7]",
  },
  {
    ticker: "O",
    date: "Apr 15 · Est.",
    dateIcon: "/marketing/upcoming/icon-cal-2.svg",
    broker: "Charles Schwab",
    brokerSrc: "/marketing/upcoming/chip-schwab.png",
    amount: "+$18.44",
    status: "Confirmed",
    statusClass:
      "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
  },
  {
    ticker: "ADC",
    date: "Apr 14 · Est.",
    dateIcon: "/marketing/upcoming/icon-cal-3.svg",
    broker: "E*TRADE",
    brokerSrc: "/marketing/upcoming/chip-etrade.png",
    amount: "+$27.05",
    status: "Pending",
    statusClass:
      "border-[rgba(224,164,92,0.3)] bg-[#241c10] text-[#e0a45c]",
  },
] as const;

/**
 * Figma Homepage section 1:1457 — Upcoming payments.
 * Copy left, card right (tilted −1.4°). Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function UpcomingPaymentsSection() {
  return (
    <section
      id="upcoming-payments"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="upcoming-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                Upcoming payments
              </div>

              <h2
                id="upcoming-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                Know what&apos;s coming{" "}
                <br className="hidden min-[1200px]:block" />
                before it lands
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Every expected distribution, matched to a ticker, a broker and a date, so
                nothing arrives as a surprise.
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

            {/* Payments card — Figma −1.4° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[-1.4deg]">
                <div className="relative flex w-full flex-col gap-1.5 rounded-[18px] border border-[#2e343b] bg-[#121417] p-5 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <div className="flex items-center justify-between">
                    <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                      Total expected
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/marketing/upcoming/icon-wallet.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="size-[14px]"
                    />
                  </div>

                  <p className="m-0 text-[24px] leading-[39.6px] font-medium tracking-[-0.48px] text-[#f2f4f7]">
                    $200.79
                  </p>

                  <ul className="m-0 flex list-none flex-col gap-2 p-0 pt-2.5">
                    {PAYMENTS.map((row) => (
                      <li
                        key={row.ticker}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-[#22262c] bg-[#16191d] px-3 py-2"
                      >
                        <div className="min-w-0 shrink-0">
                          <p className="m-0 text-[11.5px] leading-[18.98px] font-medium text-[#f2f4f7]">
                            {row.ticker}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={row.dateIcon}
                              alt=""
                              width={10}
                              height={10}
                              className="size-[10px]"
                            />
                            <span className="text-[10px] leading-[16.5px] text-[#6c737f]">
                              {row.date}
                            </span>
                          </div>
                        </div>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.brokerSrc}
                          alt={row.broker}
                          width={40}
                          height={16}
                          className="h-4 w-10 shrink-0 rounded object-cover"
                        />

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[13px] leading-[21.45px] font-medium tracking-[-0.26px] text-[#3fbf87]">
                            {row.amount}
                          </span>
                          <span
                            className={`rounded-lg border px-2 py-[3px] text-[11px] leading-[18.15px] tracking-[1.1px] uppercase ${row.statusClass}`}
                          >
                            {row.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
