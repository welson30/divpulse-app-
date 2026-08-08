import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Track unlimited candidates alongside real holdings",
    icon: "/marketing/watchlist/icon-track.svg",
  },
  {
    label: "Live price movement and yield at a glance",
    icon: "/marketing/watchlist/icon-live.svg",
  },
  {
    label: "Promote to your portfolio in one tap",
    icon: "/marketing/watchlist/icon-promote.svg",
  },
] as const;

const ROWS = [
  {
    ticker: "JEPI",
    price: "$58.42",
    spark: "/marketing/watchlist/spark-jepi.svg",
    arrow: "/marketing/watchlist/arrow-up-1.svg",
    change: "+0.42%",
    positive: true,
  },
  {
    ticker: "SCHD",
    price: "$27.11",
    spark: "/marketing/watchlist/spark-schd.svg",
    arrow: "/marketing/watchlist/arrow-up-2.svg",
    change: "+0.11%",
    positive: true,
  },
  {
    ticker: "O",
    price: "$56.90",
    spark: "/marketing/watchlist/spark-o.svg",
    arrow: "/marketing/watchlist/arrow-down.svg",
    change: "-0.08%",
    positive: false,
  },
] as const;

/**
 * Figma Homepage section 1:1591 — Watchlist.
 * Card left (tilted +1.3°), copy right. Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function WatchlistSection() {
  return (
    <section
      id="watchlist"
      className="relative border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="watchlist-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col-reverse items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Watchlist card — Figma +1.3° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[1.3deg]">
                <div className="relative flex w-full flex-col gap-3 rounded-[18px] border border-[#2e343b] bg-[#121417] p-5 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <div className="flex items-center justify-between">
                    <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                      Watchlist
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/marketing/watchlist/icon-plus.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="size-[14px]"
                    />
                  </div>

                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {ROWS.map((row) => (
                      <li
                        key={row.ticker}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-[#22262c] bg-[#16191d] px-3 py-2"
                      >
                        <div className="min-w-0 shrink-0">
                          <p className="m-0 text-[11.5px] leading-[18.98px] font-medium text-[#f2f4f7]">
                            {row.ticker}
                          </p>
                          <p className="m-0 text-[10.5px] leading-[17.33px] tracking-[-0.21px] text-[#99a1ac]">
                            {row.price}
                          </p>
                        </div>

                        <div className="h-6 w-14 shrink-0" aria-hidden>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.spark}
                            alt=""
                            className="size-full max-w-none object-contain"
                          />
                        </div>

                        <div
                          className={`flex shrink-0 items-center ${
                            row.positive ? "text-[#3fbf87]" : "text-[#d8695f]"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.arrow}
                            alt=""
                            width={15}
                            height={15}
                            className="size-[15px]"
                          />
                          <span className="text-[11px] leading-[18.15px]">{row.change}</span>
                        </div>
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
                Watchlist
              </div>

              <h2
                id="watchlist-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                Track candidates{" "}
                <br className="hidden min-[1200px]:block" />
                before you buy in
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Follow price, yield and the next ex-date on tickers you&apos;re considering,
                without adding them to your portfolio.
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
