"use client";

import { useState } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "How does PaidPrime know when I've been paid?",
    a: "PaidPrime tracks declared, ex-dividend, record and payment dates for every holding you add, then reconciles those against the cash landing in your connected or manually tracked accounts before sending an alert.",
  },
  {
    q: "Do I need to give PaidPrime trading access?",
    a: "No. Broker connections are read-only — PaidPrime can see holdings and distributions, never place trades or move funds. Manual tracking and CSV import need no broker login at all.",
  },
  {
    q: "What if my broker isn't supported yet?",
    a: "Add holdings manually or import a CSV export from your broker. You still get payment tracking, calendar dates and alerts while we expand direct connections.",
  },
  {
    q: "Can I change my notification channel?",
    a: "Yes. Switch between push, Telegram and email anytime from your account preferences — any combination you want.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Free includes up to 5 tracked holdings, real-time payment alerts, the dividend calendar and a 3-ticker watchlist. No card required.",
  },
  {
    q: "How do I enable push notifications?",
    a: "Push notifications are enabled automatically when you first sign in. Your browser will ask for permission — just click \"Allow.\" On iPhone, open PaidPrime in Safari, tap the Share icon, then \"Add to Home Screen\" to enable notifications. On Android, use Chrome and tap \"Add to Home Screen\" when prompted.",
  },
  {
    q: "Can I use PaidPrime like an app on my phone?",
    a: "Yes! PaidPrime is a PWA (Progressive Web App), which means it installs on your phone just like a native app — no App Store needed. On iPhone: open in Safari → Share → \"Add to Home Screen.\" On Android: open in Chrome → menu → \"Add to Home Screen.\" Once installed, it opens fullscreen and supports push notifications.",
  },
  {
    q: "Is my financial data safe?",
    a: "Yes. PaidPrime only reads your portfolio data — we never have access to trade on your behalf or move money. Broker connections (Pro+) use Plaid, the same secure technology used by major financial apps. All data is encrypted in transit and at rest.",
  },
  {
    q: "How do I connect my broker account?",
    a: "Broker sync is available on the Pro+ plan. Go to Settings → Connected Accounts → Connect Broker. We use Plaid to securely link your account with read-only access. Supported brokers include Fidelity, Schwab, Robinhood, IBKR, and more. For brokers not supported by Plaid, you can import your portfolio via CSV.",
  },
  {
    q: "What happens if I cancel my plan?",
    a: "You can cancel anytime from Settings → Subscription. Your plan stays active until the end of the current billing period. After that, your account moves to the Free plan and you keep access to your portfolio data. No data is deleted.",
  },
] as const;

/**
 * Figma Homepage section 1:2031 — FAQ (1440 × 899.54).
 * Shell: 1440 → px-60 → 1320 → px-12. Desktop ≥1200 = Figma; tablet/mobile = judgment.
 * Exclusive accordion: one open at a time; active question uses brand blue.
 */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-[128px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-10 min-[1200px]:gap-12 min-[1200px]:px-12">
          <Reveal className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-4 text-center min-[1200px]:gap-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2e343b] bg-[#16191d] px-[15.8px] pt-[7.2px] pb-[7.8px] text-[13px] font-medium leading-[21.45px] tracking-[2.08px] text-[#4c82f7] uppercase">
              <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
              FAQ
            </div>

            <h2
              id="faq-heading"
              className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
            >
              Frequently asked questions
            </h2>
          </Reveal>

          <Reveal delayMs={80} className="w-full max-w-[760px]">
            <div className="border-t border-[#22262c]">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <details
                    key={item.q}
                    className="faq-item group border-b border-[#22262c]"
                    open={isOpen}
                  >
                    <summary
                      className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-left [&::-webkit-details-marker]:hidden"
                      onClick={(event) => {
                        event.preventDefault();
                        setOpenIndex(isOpen ? null : index);
                      }}
                    >
                      <span
                        className={cn(
                          "text-[15px] leading-[25.58px] font-medium transition-colors duration-200 min-[1200px]:text-[15.5px]",
                          isOpen ? "text-[#4c82f7]" : "text-[#f2f4f7]",
                        )}
                      >
                        {item.q}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/marketing/faq/icon-plus.svg"
                        alt=""
                        width={18}
                        height={18}
                        className={cn(
                          "size-[18px] shrink-0 transition-transform duration-200",
                          isOpen && "rotate-45",
                        )}
                      />
                    </summary>
                    <p className="m-0 max-w-[590px] pb-6 text-[14px] leading-[23.56px] font-normal text-[#99a1ac] min-[1200px]:text-[14.5px]">
                      {item.a}
                    </p>
                  </details>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
