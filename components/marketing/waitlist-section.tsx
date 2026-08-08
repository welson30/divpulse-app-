import { Reveal } from "@/components/marketing/reveal";

/**
 * Figma Homepage section 1:2089 — Waitlist / final CTA.
 * Content centered max-w 720; form max-w 440. Desktop ≥1200 = Figma; tablet/mobile = judgment.
 */
export function WaitlistSection() {
  return (
    <section
      id="cta"
      className="relative border-b border-[#22262c] bg-[rgba(18,20,23,0.4)]"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col items-center px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-[128px]">
        <Reveal className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-[15px] text-center">
          <h2
            id="cta-heading"
            className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
          >
            Know the moment you get
            <br className="hidden min-[1200px]:block" />{" "}
            paid.
          </h2>

          <p className="m-0 max-w-[480px] pt-1 text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:max-w-[520px] min-[1200px]:text-[21.6px] min-[1200px]:leading-[34.56px]">
            Join the waitlist and get real-time dividend alerts, a
            <br className="hidden min-[1200px]:block" />{" "}
            dividend calendar and AI-driven insights the day
            <br className="hidden min-[1200px]:block" />{" "}
            PaidPrime opens up your invite.
          </p>

          <form
            action="/signup"
            method="get"
            className="flex w-full max-w-[440px] flex-col gap-3 pt-4 sm:flex-row sm:items-start sm:gap-3"
          >
            <label className="sr-only" htmlFor="cta-email">
              Email
            </label>
            <input
              id="cta-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              className="box-border h-12 w-full min-w-0 flex-1 rounded-[10px] border border-[#2e343b] bg-[#0b0c0e] px-[15.8px] text-[14.5px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] transition-colors focus:border-[#4c82f7]/60"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#4c82f7] px-6 text-[14.5px] leading-[24px] font-medium whitespace-nowrap text-white transition-[filter] hover:brightness-110"
            >
              Get Started Free
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/cta/icon-arrow.svg"
                alt=""
                width={16}
                height={16}
                className="size-4"
              />
            </button>
          </form>

          <p className="m-0 text-[12.5px] leading-[20.63px] font-normal text-[#6c737f]">
            No card required · 5 holdings free forever · Read-only access
          </p>
        </Reveal>
      </div>
    </section>
  );
}
