import { Reveal } from "@/components/marketing/reveal";

const TEMPLATES = [
  {
    title: "Privacy Mode",
    description: "Amount only — no ticker or broker shown. Recommended for shared screens.",
    phone: "/marketing/templates/phone-privacy.png",
    phoneAlt: "Privacy Mode notification showing amount only",
  },
  {
    title: "Ticker Visible",
    description: "See which holding paid you without exposing full account details.",
    phone: "/marketing/templates/phone-ticker.png",
    phoneAlt: "Ticker Visible notification showing JEPI holding",
  },
  {
    title: "Full Detail",
    description: "Ticker, broker logo and payment confirmation in a single glance.",
    phone: "/marketing/templates/phone-full.png",
    phoneAlt: "Full Detail notification with Fidelity confirmation",
  },
] as const;

/**
 * Figma Homepage section 1:509 — Notification templates (1440 × 1296.95).
 */
export function NotificationTemplatesSection() {
  return (
    <section
      id="notification-templates"
      className="relative border-b border-[#22262c] bg-[#0b0c0e]"
      aria-labelledby="templates-heading"
    >
      <div className="mx-auto box-border flex w-full max-w-[1440px] flex-col items-center gap-10 px-4 py-14 sm:gap-12 sm:px-8 sm:py-16 min-[1200px]:gap-16 min-[1200px]:px-[60px] min-[1200px]:pt-[128px] min-[1200px]:pb-16">
        <Reveal className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-4 text-center sm:gap-5 min-[1200px]:gap-[23.3px]">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#2e343b] bg-[#16191d] px-3.5 py-1.5 text-[11px] font-medium leading-snug tracking-[1.6px] text-[#4c82f7] uppercase sm:gap-2.5 sm:px-[15.8px] sm:pt-[7.2px] sm:pb-[7.8px] sm:text-[13px] sm:leading-[21.45px] sm:tracking-[2.08px]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#4c82f7]" aria-hidden />
            <span>Notification templates</span>
          </div>

          <h2
            id="templates-heading"
            className="pp-display m-0 w-full text-[clamp(30px,7vw,48px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#f2f4f7] min-[1200px]:text-[60.5px] min-[1200px]:leading-[63.5px] min-[1200px]:tracking-[-2.298px]"
          >
            Choose your notification{" "}
            <br className="hidden min-[1200px]:block" />
            privacy level
          </h2>

          <p className="m-0 max-w-[840px] text-[17px] leading-[1.55] font-normal text-[#99a1ac] sm:text-[20px] min-[1200px]:text-[24px] min-[1200px]:leading-[38px]">
            Three templates, one setting. Switch anytime from your account preferences.
          </p>
        </Reveal>

        <Reveal delayMs={80} className="mx-auto w-full max-w-[1320px]">
          <ul className="m-0 mx-auto flex list-none flex-col items-center gap-12 p-0 sm:gap-14 min-[1200px]:w-full min-[1200px]:flex-row min-[1200px]:items-start min-[1200px]:justify-center min-[1200px]:gap-[180px]">
            {TEMPLATES.map((template) => (
              <li
                key={template.title}
                className="flex w-full max-w-[300px] flex-col items-center min-[1200px]:w-[280px] min-[1200px]:max-w-[280px] min-[1200px]:shrink-0"
              >
                <div className="relative w-[min(276px,85vw)] shrink-0 min-[1200px]:w-[276px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${template.phone}?v=9`}
                    alt={template.phoneAlt}
                    width={296}
                    height={630}
                    className="pointer-events-none block h-auto w-full select-none shadow-[0px_40px_90px_-30px_rgba(0,0,0,0.85)]"
                    draggable={false}
                  />
                </div>

                <h3 className="pp-display m-0 pt-8 text-center text-[22px] leading-[36.3px] font-semibold tracking-[-0.44px] text-[#f2f4f7]">
                  {template.title}
                </h3>

                <p className="m-0 max-w-[280px] pt-[9px] text-center text-[15px] leading-[24.75px] font-normal text-[#99a1ac] sm:text-[16px]">
                  {template.description}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
