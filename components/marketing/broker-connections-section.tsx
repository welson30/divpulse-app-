import { Reveal } from "@/components/marketing/reveal";

const BROKERS = [
  { name: "Robinhood", src: "/marketing/brokers/robinhood.png" },
  { name: "Charles Schwab", src: "/marketing/brokers/charles-schwab.png" },
  { name: "Fidelity", src: "/marketing/brokers/fidelity.png" },
  { name: "Vanguard", src: "/marketing/brokers/vanguard.png" },
  { name: "Wealthsimple Trade", src: "/marketing/brokers/wealthsimple.png" },
  { name: "Questrade", src: "/marketing/brokers/questrade.png" },
  { name: "DEGIRO", src: "/marketing/brokers/degiro.png" },
  { name: "Tradier", src: "/marketing/brokers/tradier.png" },
  { name: "TradeStation", src: "/marketing/brokers/tradestation.png" },
  { name: "Alpaca", src: "/marketing/brokers/alpaca.png" },
  { name: "E*TRADE", src: "/marketing/brokers/etrade.png" },
  { name: "Webull", src: "/marketing/brokers/webull.png" },
] as const;

const TRUST = [
  { label: "Read-only access", icon: "/marketing/brokers/icon-lock.svg" },
  { label: "Bank-grade encryption", icon: "/marketing/brokers/icon-shield.svg" },
  { label: "Sub-minute sync", icon: "/marketing/brokers/icon-bolt.svg" },
] as const;

/**
 * Figma Homepage section 1:347 — Broker connections (1440 x 977.64).
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function BrokerConnectionsSection() {
  return (
    <section
      id="connections"
      className="relative border-b border-[#22262c] bg-[#0b0c0e] min-[1200px]:min-h-[977.64px]"
      aria-labelledby="brokers-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col items-center gap-8 px-4 py-14 sm:gap-10 sm:px-8 sm:py-16 min-[1200px]:min-h-[977.64px] min-[1200px]:gap-[39.7px] min-[1200px]:px-[108px] min-[1200px]:py-[128px]">
        <Reveal className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-4 text-center sm:gap-5 min-[1200px]:gap-[23px]">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#2e343b] bg-[#16191d] px-3.5 py-1.5 text-[11px] font-medium leading-snug tracking-[1.6px] text-[#4c82f7] uppercase sm:gap-2.5 sm:px-[15.8px] sm:pt-[7.2px] sm:pb-[7.8px] sm:text-[13px] sm:leading-[21.45px] sm:tracking-[2.08px]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
            <span>Broker connections</span>
          </div>

          <h2
            id="brokers-heading"
            className="pp-display m-0 w-full text-[clamp(30px,7vw,48px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
          >
            Automatically syncs with your{" "}
            <br className="hidden min-[1200px]:block" />
            broker
          </h2>

          <p className="m-0 max-w-[840px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
            Connect the accounts you already use in read-only mode. PaidPrime reconciles
            positions and watches for distribution events across every source.
          </p>
        </Reveal>

        <Reveal delayMs={80} className="mx-auto w-full max-w-[1180px]">
          <ul className="m-0 grid w-full list-none grid-cols-2 gap-2.5 p-0 sm:gap-3 min-[768px]:grid-cols-3 min-[768px]:gap-3.5 min-[1200px]:!grid-cols-4 min-[1200px]:h-[331.28px] min-[1200px]:gap-4 min-[1200px]:pt-[16.3px]">
            {BROKERS.map((broker) => (
              <li
                key={broker.name}
                className="flex aspect-[283/93] items-center justify-center overflow-hidden rounded-[14px] bg-[#121417] sm:rounded-[16px] min-[1200px]:aspect-auto min-[1200px]:h-[94.32px] min-[1200px]:rounded-[18px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={broker.src}
                  alt={broker.name}
                  width={283}
                  height={93}
                  className="block size-full object-cover opacity-90 transition-[opacity,transform] duration-200 ease-out hover:scale-[1.02] hover:opacity-100 motion-reduce:hover:scale-100"
                />
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Figma 1:392 — w 1140, justify-center, gap-x 40 */}
        <Reveal delayMs={160} className="mx-auto w-full max-w-[1140px]">
          <ul className="m-0 flex w-full list-none flex-col items-center justify-center gap-3 p-0 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
            {TRUST.map((item) => (
              <li
                key={item.label}
                className="inline-flex shrink-0 items-center gap-2.5 text-[15px] leading-[26px] whitespace-nowrap text-[#99a1ac] min-[1200px]:text-[16px] min-[1200px]:leading-[26.4px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt="" width={18} height={18} className="size-[18px] shrink-0" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
