import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

// About/Careers/Press kit/Blog dropped — no pages exist for any of them yet.
// Re-add once there's a real destination; a link to nowhere is worse than no link.
// Terms of service/Security/Disclosures/Cookie settings still have no real
// page — only add them here once real content exists for each.

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <p className="m-0 text-[13px] leading-[21.45px] font-semibold tracking-[2.08px] text-[#6c737f] uppercase">
        {title}
      </p>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[16px] leading-[26.4px] font-normal text-[#99a1ac] transition-colors hover:text-[#f2f4f7]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Figma Homepage Footer 1:2337.
 * Shell: 1440 → px-60 → 1320 → px-12.
 * Desktop: brand (2fr) + Product / Company / Resources / Legal in one row.
 */
export async function SiteFooter() {
  const t = await getTranslations("footer");

  const productLinks = [
    { href: "#product", label: t("product.dashboard") },
    { href: "#dividend-alerts", label: t("product.dividendAlerts") },
    { href: "#analytics", label: t("product.analytics") },
    { href: "#dividend-calendar", label: t("product.dividendCalendar") },
    { href: "#ai-advisor", label: t("product.aiAdvisor") },
    { href: "#pricing", label: t("product.pricing") },
  ] as const;

  const companyLinks = [
    { href: "mailto:paidprime1@gmail.com", label: t("company.contact") },
  ] as const;

  const resourceLinks = [
    { href: "#faq", label: t("resources.faq") },
    { href: "mailto:paidprime1@gmail.com?subject=PaidPrime%20support", label: t("resources.helpCenter") },
    { href: "#connections", label: t("resources.brokerConnections") },
  ] as const;

  const legalLinks = [
    { href: "/privacy", label: t("legal.privacyPolicy") },
  ] as const;

  return (
    <footer className="relative border-t border-[#22262c] bg-[#0b0c0e]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(76,130,247,0.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto box-border w-full max-w-[1440px] px-4 sm:px-8 min-[1200px]:px-[60px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-0 pt-14 pb-10 min-[1200px]:gap-16 min-[1200px]:px-12 min-[1200px]:pt-20 min-[1200px]:pb-12">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 min-[900px]:grid-cols-4 min-[1200px]:grid-cols-[minmax(280px,2fr)_repeat(4,minmax(0,1fr))] min-[1200px]:gap-12">
            <div className="col-span-2 flex flex-col gap-2.5 min-[900px]:col-span-4 min-[1200px]:col-span-1">
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <span className="relative size-9 shrink-0 min-[1200px]:size-11">
                  <Image src="/logo.svg" alt="" fill className="rounded-[8px] object-contain" sizes="44px" />
                </span>
                <span className="font-[family-name:var(--font-inter-tight)] text-[19px] font-semibold text-[#f2f4f7] min-[1200px]:text-[22px]">
                  PaidPrime
                </span>
              </Link>

              <p className="m-0 max-w-[320px] pt-3.5 text-[15px] leading-[24px] font-normal text-[#99a1ac] min-[1200px]:text-[16px] min-[1200px]:leading-[26px]">
                {t("description")}
              </p>

              <div className="flex flex-col gap-2 pt-3.5">
                <a
                  href="mailto:paidprime1@gmail.com"
                  className="inline-flex items-center gap-2.5 text-[15px] leading-[24.75px] text-[#99a1ac] transition-colors hover:text-[#f2f4f7]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/marketing/footer/icon-mail.svg"
                    alt=""
                    width={17}
                    height={17}
                    className="size-[17px] shrink-0"
                  />
                  paidprime1@gmail.com
                </a>
                <p className="m-0 inline-flex items-center gap-2.5 text-[15px] leading-[24.75px] text-[#99a1ac]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/marketing/footer/icon-pin.svg"
                    alt=""
                    width={17}
                    height={17}
                    className="size-[17px] shrink-0"
                  />
                  Florida - USA
                </p>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://www.instagram.com/paid.prime"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="PaidPrime on Instagram"
                  className="group flex size-9 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#0f1117] text-[#6c737f] transition-all hover:border-[rgba(168,85,247,0.4)] hover:bg-[rgba(168,85,247,0.08)] hover:text-[#c084fc]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>
            </div>

            <FooterColumn title={t("columns.product")} links={productLinks} />
            <FooterColumn title={t("columns.company")} links={companyLinks} />
            <FooterColumn title={t("columns.resources")} links={resourceLinks} />
            <FooterColumn title={t("columns.legal")} links={legalLinks} />
          </div>

          <div className="flex flex-col gap-3 border-t border-[#22262c] pt-8 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
            <p className="m-0 text-[14px] leading-[24px] text-[#6c737f] min-[1200px]:text-[15px] min-[1200px]:leading-[24.75px]">
              {t("copyright")}
            </p>
            <p className="m-0 text-[14px] leading-[24px] text-[#6c737f] min-[1200px]:text-right min-[1200px]:text-[15px] min-[1200px]:leading-[24.75px]">
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
