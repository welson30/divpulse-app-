import type { Metadata } from "next";
import Image from "next/image";
import { PrimaryCta } from "@/components/marketing/primary-cta";

export const metadata: Metadata = {
  title: "PaidPrime — Coming soon",
  description:
    "Real-time dividend alerts — the instant a payment lands, before your broker's app tells you.",
};

/**
 * Public coming-soon gate. The full marketing site lives at /homepage —
 * swap the two when the site goes live.
 *
 * Uses the same tokens as the rest of the marketing site (#0b0c0e ground,
 * #22262c hairlines, #4c82f7 accent, pp-display headings) rather than the
 * older standalone palette this replaced, so the gate and the real site
 * read as one product.
 *
 * One deliberate difference from the version on main: that form kept the
 * email client-side, showed "You're on the list — we'll be in touch," and
 * discarded it — there is no waitlist table and nothing read the value.
 * Rather than promise a follow-up that can't happen, the form carries the
 * address to /signup, matching components/marketing/waitlist-section.tsx.
 * Restore the original wording once somewhere durable exists to store it.
 */
export default function ComingSoonPage() {
  return (
    <div className="pp-landing flex min-h-dvh flex-col bg-[#0b0c0e]">
      <header className="border-b border-[#22262c]">
        <div className="mx-auto flex w-full max-w-[1320px] items-center gap-2.5 px-4 py-5 sm:px-8">
          <Image src="/logo.svg" alt="" width={32} height={32} priority className="size-8 rounded-[8px]" />
          <span className="font-[family-name:var(--font-inter-tight)] text-[17px] font-semibold tracking-[-0.01em] text-[#f2f4f7]">
            PaidPrime
          </span>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(76,130,247,0.16), transparent 70%)",
          }}
        />

        <div className="relative flex w-full max-w-[560px] flex-col items-center gap-5 text-center">
          <div className="pp-fade-up inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] leading-[21.45px] font-medium tracking-[2.08px] text-[#4c82f7] uppercase">
            <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
            Coming soon
          </div>

          <h1 className="pp-display pp-fade-up m-0 text-[clamp(32px,7vw,56px)] leading-[1.08] font-semibold tracking-[-0.04em] text-[#f2f4f7]">
            Know the moment
            <br />
            you&rsquo;re paid.
          </h1>

          <p className="pp-fade-up-delay m-0 max-w-[420px] text-[17px] leading-[1.6] text-[#99a1ac] sm:text-[19px]">
            Real-time dividend alerts — the instant a payment lands, before your broker&rsquo;s app tells you.
          </p>

          <form
            action="/signup"
            method="get"
            className="pp-fade-up-delay-2 mt-2 flex w-full max-w-[440px] flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="you@domain.com"
              aria-label="Your email address"
              className="box-border h-[52px] min-w-0 flex-1 rounded-[14px] border border-[#2e343b] bg-[#121417] px-4 text-[16px] text-[#f2f4f7] transition-colors outline-none placeholder:text-[#6c737f] focus:border-[#4c82f7]/60"
            />
            <PrimaryCta type="submit" className="h-[52px] shrink-0 rounded-[14px] px-6 text-[16px]">
              Get early access
            </PrimaryCta>
          </form>

          <p className="pp-fade-up-delay-2 m-0 text-[13px] leading-[21px] text-[#6c737f]">
            Free for 5 tracked holdings. No card required.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#22262c]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-1.5 px-4 py-5 text-center sm:px-8">
          <p className="m-0 text-[12px] leading-[19.8px] text-[#6c737f]">
            &copy; {new Date().getFullYear()} PaidPrime. All rights reserved.
          </p>
          {/* Required attribution for Logo.dev's free tier (commercial use) — see lib/tickers/logo.ts */}
          <a
            href="https://logo.dev"
            className="text-[11px] leading-[18px] text-[#6c737f] transition-colors hover:text-[#99a1ac]"
          >
            Logos provided by Logo.dev
          </a>
        </div>
      </footer>
    </div>
  );
}
