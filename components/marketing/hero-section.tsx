import Link from "next/link";
import { HeroPhone } from "@/components/marketing/hero-phone";
import { StatCountUp } from "@/components/marketing/stat-count-up";

const FEATURE_PILLS = [
  "Portfolio Tracking",
  "Dividend Alerts",
  "Passive Income",
  "AI Advisor",
  "Goals",
  "Analytics",
] as const;

const STATS = [
  {
    end: 412,
    prefix: "$",
    suffix: "M",
    commas: false,
    label: "Dividends tracked",
    hint: "Across every linked account",
    icon: "/marketing/hero/stat-wallet.svg",
    iconBg: "bg-[#10261e]",
  },
  {
    end: 38400,
    prefix: "",
    suffix: "+",
    commas: true,
    label: "Income investors",
    hint: "Compounding with PaidPrime",
    icon: "/marketing/hero/stat-users.svg",
    iconBg: "bg-[#16233d]",
  },
  {
    end: 60,
    prefix: "< ",
    suffix: "s",
    commas: false,
    label: "Alert latency",
    hint: "From payment to notification",
    icon: "/marketing/hero/stat-bell.svg",
    iconBg: "bg-[#16233d]",
  },
  {
    end: 12,
    prefix: "",
    suffix: "",
    commas: false,
    label: "Brokers supported",
    hint: "Read-only, bank-grade sync",
    icon: "/marketing/hero/stat-shield.svg",
    iconBg: "bg-[#16233d]",
  },
] as const;

/**
 * Figma Homepage section 1:7 (1440×1197) under header 1:2452.
 * Layout + type for desktop/tablet/mobile live in globals.css (.pp-hero-*).
 */
export function HeroSection() {
  return (
    <section className="pp-hero-section">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 35% at 50% -5%, rgba(76,130,247,0.2), transparent 60%), radial-gradient(ellipse 35% 30% at 90% 18%, rgba(63,191,135,0.12), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(#22262c 1px, transparent 1px), linear-gradient(90deg, #22262c 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(180deg, black 0%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 80%)",
        }}
      />

      <div className="pp-hero-shell">
        <div className="pp-hero-row">
          <div className="pp-hero-copy pp-fade-up">
            <h1 className="pp-hero-title pp-display">
              Your money works.
              <br />
              <span className="text-[#4c82f7]">PaidPrime</span> keeps
              <br />
              you informed.
            </h1>

            {/* Natural wrap only — Figma soft-breaks were fighting our font metrics */}
            <p className="pp-hero-desc pp-fade-up-delay">
              Everything you need to build wealth in one intelligent platform. Track your
              portfolio, monitor passive income, receive real-time dividend alerts, and get
              personalized AI insights—so you can focus on what matters most.
            </p>

            <div className="pp-fade-up-delay-2 flex flex-wrap items-center gap-3 pt-[9px] sm:gap-4">
              <Link
                href="/signup"
                className="relative inline-flex h-12 items-center justify-center gap-2.5 rounded-[18px] bg-[#4c82f7] px-6 text-[16px] font-semibold text-white shadow-[0px_20px_50px_-18px_#4c82f7] transition-[filter] hover:brightness-110 sm:h-14 sm:px-8 sm:text-[17px] min-[1200px]:h-16 min-[1200px]:px-9 min-[1200px]:text-[19px]"
              >
                Get Started Free
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/hero/arrow-right.svg"
                  alt=""
                  width={21}
                  height={21}
                  className="size-4 sm:size-[21px]"
                />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-[18px] border border-[#2e343b] bg-[#16191d] px-6 text-[16px] font-semibold text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/50 sm:h-14 sm:px-8 sm:text-[17px] min-[1200px]:h-16 min-[1200px]:px-9 min-[1200px]:text-[19px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/hero/play.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="size-4 sm:size-[19px]"
                />
                See How It Works
              </Link>
            </div>

            <ul className="pp-hero-pills">
              {FEATURE_PILLS.map((pill) => (
                <li key={pill} className="pp-hero-pill">
                  {pill}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/hero/shield.svg"
                alt=""
                width={18}
                height={18}
                className="size-[18px] shrink-0"
              />
              <p className="text-[13px] leading-6 text-[#6c737f] sm:text-[15px] sm:leading-[24.75px]">
                Read-only broker access · Bank-grade encryption
              </p>
            </div>
          </div>

          <div className="pp-hero-phone">
            <div className="pp-hero-phone-frame">
              <HeroPhone />
            </div>
          </div>
        </div>
      </div>

      <div className="pp-hero-stats">
        <div className="pp-hero-stats-grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex h-full flex-col bg-[#121417] px-6 py-7 sm:px-7 sm:py-8">
              <div
                className={`mb-[5px] flex size-12 items-center justify-center rounded-[14px] border border-[#2e343b] ${stat.iconBg}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stat.icon} alt="" width={22} height={22} className="size-[22px]" />
              </div>
              <p className="pt-[15px] text-[28px] font-semibold tracking-[-0.68px] text-[#f2f4f7] tabular-nums sm:text-[34px]">
                <StatCountUp
                  end={stat.end}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  commas={stat.commas}
                />
              </p>
              <p className="pt-[7px] text-[15px] font-medium leading-6 text-[#f2f4f7]">{stat.label}</p>
              <p className="text-[13.5px] leading-[22px] text-[#99a1ac]">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
