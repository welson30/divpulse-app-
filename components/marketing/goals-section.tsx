import { Reveal } from "@/components/marketing/reveal";

const BULLETS = [
  {
    label: "Set custom income and net-worth targets",
    icon: "/marketing/goals/icon-targets.svg",
  },
  {
    label: "Progress updates automatically with each payment",
    icon: "/marketing/goals/icon-progress.svg",
  },
  {
    label: "See exactly how far you are from financial freedom",
    icon: "/marketing/goals/icon-freedom.svg",
  },
] as const;

const GOALS = [
  {
    label: "Monthly income",
    range: "$680 / $1,000",
    percent: 68,
    color: "#4c82f7",
  },
  {
    label: "Annual income",
    range: "$4,220 / $5,350",
    percent: 79,
    color: "#3fbf87",
  },
  {
    label: "Financial independence",
    range: "$142,880 / $420,000",
    percent: 34,
    color: "#e0a45c",
  },
] as const;

const RING_R = 29.5;
const RING_C = 2 * Math.PI * RING_R;

function GoalRing({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const dash = (percent / 100) * RING_C;
  return (
    <div className="relative size-16">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={RING_R}
          fill="none"
          stroke="#22262c"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_C}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[22px] leading-[22px] font-medium tracking-[-0.44px] text-[#f2f4f7]">
        {percent}%
      </span>
    </div>
  );
}

/**
 * Figma Homepage section 1:1944 — Goals.
 * Copy left, card right (tilted −1.5°). Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function GoalsSection() {
  return (
    <section
      id="goals"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="goals-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
        <div className="mx-auto flex w-full max-w-[1320px] min-[1200px]:px-12">
          <Reveal className="flex w-full flex-col items-stretch gap-10 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16">
            {/* Copy column */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 min-[1200px]:gap-[15.1px]">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
                Goals
              </div>

              <h2
                id="goals-heading"
                className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
              >
                Set the target, watch{" "}
                <br className="hidden min-[1200px]:block" />
                the progress
              </h2>

              <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
                Monthly income, annual income and full financial independence — tracked
                automatically as payments land.
              </p>

              <ul className="m-0 flex w-full list-none flex-col gap-3 p-0 pt-2 min-[1200px]:pt-[8.89px]">
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

            {/* Goals card — Figma −1.5° tilt */}
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 inset-y-0 rounded-[28px] border border-[#22262c] bg-[rgba(18,20,23,0.3)] min-[1200px]:inset-x-12"
              />
              <div className="relative w-full max-w-[420px] rotate-[-1.5deg]">
                <div className="relative flex w-full flex-col gap-3 rounded-[18px] border border-[#2e343b] bg-[#121417] px-5 pt-[18.8px] pb-5 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.85)]">
                  <p className="m-0 text-[10.5px] leading-[17.33px] font-normal tracking-[1.47px] text-[#6c737f] uppercase">
                    Goals
                  </p>

                  <div className="flex gap-2">
                    {GOALS.map((goal) => (
                      <div
                        key={goal.label}
                        className="flex min-w-0 flex-1 flex-col items-center rounded-[10px] border border-[#22262c] bg-[#16191d] px-1.5 pt-3 pb-2.5"
                      >
                        <GoalRing percent={goal.percent} color={goal.color} />
                        <p className="m-0 mt-2 text-center text-[10px] leading-[12.5px] font-medium text-[#f2f4f7]">
                          {goal.label}
                        </p>
                        <p className="m-0 mt-0.5 text-center text-[9px] leading-[11.25px] tracking-[-0.18px] text-[#99a1ac]">
                          {goal.range}
                        </p>
                      </div>
                    ))}
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
