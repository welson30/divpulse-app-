import { PrimaryCta } from "@/components/marketing/primary-cta";

const STEPS = [
  {
    n: "01",
    title: "Connect a broker",
    body: "Read-only sync with your brokerage so holdings stay current automatically.",
    icon: "/marketing/onboarding/icon-broker.svg",
  },
  {
    n: "02",
    title: "Choose alert privacy",
    body: "Pick push, email or Telegram, and decide what shows up on a locked screen.",
    icon: "/marketing/onboarding/icon-privacy.svg",
  },
  {
    n: "03",
    title: "Set an income goal",
    body: "Give your dashboard a target monthly or annual passive-income figure to track.",
    icon: "/marketing/onboarding/icon-goal.svg",
  },
] as const;

/**
 * Figma Onboarding Page 1 (8:200) — right column.
 * Desktop copy wraps like the design; mobile lets lines flow.
 */
export function OnboardingWelcome({ firstName }: { firstName?: string | null }) {
  const heading = firstName
    ? `Welcome to PaidPrime, ${firstName}.`
    : "Welcome to PaidPrime.";

  return (
    <div className="flex w-full max-w-[430px] flex-col">
      <p className="m-0 text-[11px] leading-[18px] tracking-[2.2px] text-[#99a1ac] uppercase">
        Account created
      </p>
      <h1 className="pp-display m-0 mt-1 text-[clamp(24px,5vw,28px)] font-semibold leading-[1.05] tracking-[-1.06px] text-[#f2f4f7]">
        {heading}
      </h1>
      <p className="m-0 mt-2 text-[14px] leading-[22.75px] text-[#99a1ac]">
        Three quick steps and your income dashboard is fully live.
      </p>

      <ol className="m-0 flex list-none flex-col gap-3 py-6 pl-0">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="flex gap-4 rounded-[14px] border border-[#22262c] bg-[#16191d] p-5"
          >
            <span className="shrink-0 pt-0.5 text-[13px] leading-[21px] tracking-[-0.26px] text-[#6c737f]">
              {step.n}
            </span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#121417]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.icon}
                alt=""
                width={16}
                height={16}
                className="size-4"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[14px] leading-[23px] font-semibold text-[#f2f4f7]">
                {step.title}
              </p>
              <p className="m-0 mt-1 text-[13px] leading-[21px] text-[#99a1ac]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <PrimaryCta
        href="/dashboard"
        className="h-[48px] w-full rounded-[10px] text-[15px] font-medium leading-[25px] shadow-[0px_16px_40px_-16px_#4c82f7]"
      >
        Enter your dashboard
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/onboarding/icon-arrow.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </PrimaryCta>
    </div>
  );
}
