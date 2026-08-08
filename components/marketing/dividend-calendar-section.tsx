import { Reveal } from "@/components/marketing/reveal";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** April starts on Tuesday → 2 empty cells before day 1 (Sun-first grid). */
const APRIL_START_OFFSET = 2;
const APRIL_DAYS = 30;

const PAYMENTS: Record<
  number,
  { label: string; broker: string; brokerSrc: string }
> = {
  3: {
    label: "XYLD +$42.86",
    broker: "Fidelity",
    brokerSrc: "/marketing/calendar/chip-fidelity.png",
  },
  4: {
    label: "JEPI +$61.20",
    broker: "Vanguard",
    brokerSrc: "/marketing/calendar/chip-vanguard.png",
  },
  9: {
    label: "MAIN +$12.40",
    broker: "TradeStation",
    brokerSrc: "/marketing/calendar/chip-tradestation.png",
  },
  14: {
    label: "ADC +$27.05",
    broker: "Charles Schwab",
    brokerSrc: "/marketing/calendar/chip-charles-schwab.png",
  },
  15: {
    label: "O +$18.44",
    broker: "Fidelity",
    brokerSrc: "/marketing/calendar/chip-fidelity.png",
  },
  22: {
    label: "STAG +$9.80",
    broker: "Alpaca",
    brokerSrc: "/marketing/calendar/chip-alpaca.png",
  },
  26: {
    label: "SCHD +$94.10",
    broker: "Charles Schwab",
    brokerSrc: "/marketing/calendar/chip-charles-schwab.png",
  },
};

const CONNECTED_BROKERS = [
  { name: "Robinhood", src: "/marketing/calendar/chip-robinhood.png" },
  { name: "Charles Schwab", src: "/marketing/calendar/chip-charles-schwab.png" },
  { name: "Fidelity", src: "/marketing/calendar/chip-fidelity.png" },
  { name: "Vanguard", src: "/marketing/calendar/chip-vanguard.png" },
  { name: "Wealthsimple Trade", src: "/marketing/calendar/chip-wealthsimple.png" },
  { name: "Questrade", src: "/marketing/calendar/chip-questrade.png" },
  { name: "DEGIRO", src: "/marketing/calendar/chip-degiro.png" },
  { name: "Tradier", src: "/marketing/calendar/chip-tradier.png" },
  { name: "TradeStation", src: "/marketing/calendar/chip-tradestation.png" },
  { name: "Alpaca", src: "/marketing/calendar/chip-alpaca.png" },
  { name: "E*TRADE", src: "/marketing/calendar/chip-etrade.png" },
  { name: "Webull", src: "/marketing/calendar/chip-webull.png" },
] as const;

const CELLS = (() => {
  const total = APRIL_START_OFFSET + APRIL_DAYS;
  return Array.from({ length: total }, (_, i) => {
    if (i < APRIL_START_OFFSET) return null;
    return i - APRIL_START_OFFSET + 1;
  });
})();

/**
 * Figma Homepage section 1:1153 — Dividend calendar (1440 × 1147.45).
 * Shell: 1440 → px-60 → 1320 → px-12. Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function DividendCalendarSection() {
  return (
    <section
      id="dividend-calendar"
      className="relative border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="calendar-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-[128px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-8 min-[1200px]:gap-[39.8px] min-[1200px]:px-12">
          <Reveal className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 text-center min-[1200px]:gap-[15.1px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
              <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
              Dividend calendar
            </div>

            <h2
              id="calendar-heading"
              className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
            >
              Every payment date, in{" "}
              <br className="hidden min-[1200px]:block" />
              one view
            </h2>

            <p className="m-0 max-w-[680px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
              See expected income land on the calendar before it hits your account — matched
              to the broker it&apos;s paid from.
            </p>
          </Reveal>

          <Reveal
            delayMs={80}
            className="w-full overflow-hidden rounded-[18px] border border-[#2e343b] bg-[#121417] shadow-[0px_30px_70px_-35px_rgba(0,0,0,0.8)]"
          >
            {/* Month header */}
            <div className="flex items-center justify-between border-b border-[#22262c] px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/calendar/icon-month.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4"
                />
                <span className="text-[14px] leading-[23.1px] font-medium text-[#f2f4f7]">
                  April
                </span>
              </div>
              <span className="text-[13px] leading-[21.45px] tracking-[-0.26px] text-[#3fbf87]">
                Est. $471.99 this month
              </span>
            </div>

            {/* Grid */}
            <div className="p-3 sm:p-5 min-[1200px]:p-6">
              <div className="mb-1.5 grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={`${day}-${i}`}
                    className="pb-1.5 text-center text-[10px] leading-[16.5px] tracking-[1px] text-[#6c737f] uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 min-[1200px]:h-[384px] min-[1200px]:grid-rows-5">
                {CELLS.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="min-h-[56px] min-[1200px]:min-h-[72px]" />;
                  }

                  const payment = PAYMENTS[day];
                  if (payment) {
                    return (
                      <div
                        key={day}
                        className="flex min-h-[56px] flex-col gap-1 rounded-[10px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] p-[5.8px] min-[1200px]:min-h-[72px]"
                      >
                        <span className="text-[10px] leading-[16.5px] text-[#6c737f]">{day}</span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-[10px] leading-[16.5px] font-medium tracking-[-0.2px] text-[#3fbf87]">
                            {payment.label}
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={payment.brokerSrc}
                            alt={payment.broker}
                            width={36}
                            height={12}
                            className="h-3 w-9 rounded-[3px] object-cover opacity-90"
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={day}
                      className="flex min-h-[56px] flex-col rounded-[10px] border border-[#22262c] p-[5.8px] min-[1200px]:min-h-[72px]"
                    >
                      <span className="text-[10px] leading-[16.5px] text-[#6c737f]">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connected brokers */}
            <div className="flex flex-col gap-3 border-t border-[#22262c] px-4 pt-[15px] pb-4 sm:px-6">
              <p className="m-0 text-[10.5px] leading-[17.33px] tracking-[1.47px] text-[#6c737f] uppercase">
                Connected brokers
              </p>
              <ul className="m-0 flex list-none flex-wrap items-center gap-x-2.5 gap-y-2 p-0">
                {CONNECTED_BROKERS.map((broker) => (
                  <li
                    key={broker.name}
                    className="h-6 w-[62px] shrink-0 overflow-hidden rounded-[5px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={broker.src}
                      alt={broker.name}
                      width={62}
                      height={24}
                      className="size-full object-cover"
                    />
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
