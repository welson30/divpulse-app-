"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

// Stable numeric indices (1-10) matching translation keys q1/a1 … q10/a10
const FAQ_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * Figma Homepage section 1:2031 — FAQ (1440 × 899.54).
 * Shell: 1440 → px-60 → 1320 → px-12. Desktop ≥1200 = Figma; tablet/mobile = judgment.
 * Exclusive accordion: one open at a time; active question uses brand blue.
 */
export function FaqSection() {
  const t = useTranslations("faq");
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
              {t("eyebrow")}
            </div>

            <h2
              id="faq-heading"
              className="pp-display m-0 w-full text-[clamp(30px,6vw,60.5px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
            >
              {t("title")}
            </h2>
          </Reveal>

          <Reveal delayMs={80} className="w-full max-w-[760px]">
            <div className="border-t border-[#22262c]">
              {FAQ_INDICES.map((n, index) => {
                const isOpen = openIndex === index;

                return (
                  <details
                    key={n}
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
                        {t(`items.q${n}`)}
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
                      {t(`items.a${n}`)}
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
