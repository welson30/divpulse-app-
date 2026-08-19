"use client";

import { useState } from "react";
import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Live breakdown by strategy sleeve",
    icon: "/marketing/diversification/icon-breakdown.svg",
  },
  {
    label: "Spot concentration before it's a problem",
    icon: "/marketing/diversification/icon-concentration.svg",
  },
  {
    label: "Rebalance with confidence, not guesswork",
    icon: "/marketing/diversification/icon-rebalance.svg",
  },
] as const;

// Same palette as components/dashboard/allocation-donut.tsx's ALLOC_COLORS,
// for consistency between the marketing preview and the real in-app chart.
const ALLOCATION = [
  { label: "Covered call ETFs", percent: 34, color: "#4c82f7" },
  { label: "Dividend growth", percent: 27, color: "#3fbf87" },
  { label: "REITs", percent: 21, color: "#e0a45c" },
  { label: "Broad market", percent: 18, color: "#8b7fe8" },
] as const;

const DONUT_RADIUS = 50;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Figma Homepage section 1:1033 — Diversification (1440 × 602.94).
 * Shell: 1440 → px-60 → 1320 → px-12 (content at 108).
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function DiversificationSection() {
  const [active, setActive] = useState<string | null>(null);

  const arcs = ALLOCATION.map((segment, index) => {
    const priorPercent = ALLOCATION.slice(0, index).reduce((sum, s) => sum + s.percent, 0);
    return {
      ...segment,
      dash: (segment.percent / 100) * DONUT_CIRCUMFERENCE,
      offset: (priorPercent / 100) * DONUT_CIRCUMFERENCE,
    };
  });

  return (
    <section
      id="diversification"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="diversification-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                Diversification
              </div>

              <h2
                id="diversification-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                See exactly where{" "}
                <br className="hidden min-[1200px]:block" />
                your income comes{" "}
                <br className="hidden min-[1200px]:block" />
                from
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                A single view of allocation across strategies, so concentration risk never
                sneaks up on you.
              </p>

              <ul className="m-0 flex w-full list-none flex-col gap-3 p-0 pt-2 min-[1200px]:gap-3 min-[1200px]:pt-[8.89px]">
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
                    <span className="pt-0.5 text-[14px] leading-[23.1px] font-normal text-[#99a1ac] sm:text-[15px] min-[1200px]:text-[14px]">
                      {bullet.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Allocation card — Figma -1.5° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center min-[1200px]:justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[-1.5deg]">
                <div className="relative flex w-full flex-col gap-4 rounded-[18px] border border-[#2e343b] bg-[#121417] px-5 pt-[18.8px] pb-[19.8px] shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                    Allocation
                  </p>

                  <div className="flex items-center gap-5">
                    <div className="relative size-32 shrink-0">
                      <svg viewBox="0 0 128 128" width={128} height={128} role="img" aria-label="Sample allocation breakdown" className="size-32">
                        <circle cx={64} cy={64} r={DONUT_RADIUS} fill="none" stroke="#22262c" strokeWidth={16} />
                        {arcs.map((arc) => {
                          const dimmed = active != null && active !== arc.label;
                          return (
                            <circle
                              key={arc.label}
                              cx={64}
                              cy={64}
                              r={DONUT_RADIUS}
                              fill="none"
                              stroke={arc.color}
                              strokeWidth={16}
                              strokeDasharray={`${arc.dash} ${DONUT_CIRCUMFERENCE - arc.dash}`}
                              strokeDashoffset={-arc.offset}
                              strokeLinecap="butt"
                              transform="rotate(-90 64 64)"
                              pointerEvents="stroke"
                              className="cursor-pointer transition-opacity"
                              style={{ opacity: dimmed ? 0.35 : 1 }}
                              onMouseEnter={() => setActive(arc.label)}
                              onMouseLeave={() => setActive(null)}
                            />
                          );
                        })}
                      </svg>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[15px] leading-[24.75px] font-medium tracking-[-0.3px] text-[#f2f4f7]">
                          100%
                        </span>
                        <span className="text-[9.5px] leading-[15.68px] font-normal text-[#99a1ac]">
                          Allocated
                        </span>
                      </div>
                    </div>

                    <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
                      {ALLOCATION.map((row) => {
                        const dimmed = active != null && active !== row.label;
                        return (
                          <li
                            key={row.label}
                            className="flex cursor-pointer items-center justify-between gap-3 transition-opacity"
                            style={{ opacity: dimmed ? 0.5 : 1 }}
                            onMouseEnter={() => setActive(row.label)}
                            onMouseLeave={() => setActive(null)}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2 shrink-0 rounded-[6px]"
                                style={{ backgroundColor: row.color }}
                                aria-hidden
                              />
                              <span className="truncate text-[12px] leading-[19.8px] font-normal text-[#99a1ac]">
                                {row.label}
                              </span>
                            </span>
                            <span className="shrink-0 text-[12px] leading-[19.8px] font-normal tracking-[-0.24px] text-[#f2f4f7]">
                              {row.percent}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
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
