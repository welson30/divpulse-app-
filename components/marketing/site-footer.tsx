import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "#product", label: "Dashboard" },
  { href: "#dividend-alerts", label: "Dividend alerts" },
  { href: "#analytics", label: "Analytics" },
  { href: "#dividend-calendar", label: "Dividend calendar" },
  { href: "#ai-advisor", label: "AI Advisor" },
  { href: "#pricing", label: "Pricing" },
] as const;

const COMPANY_LINKS = [
  { href: "#", label: "About" },
  { href: "#", label: "Careers" },
  { href: "#", label: "Press kit" },
  { href: "#", label: "Blog" },
  { href: "mailto:support@paidprime.com", label: "Contact" },
] as const;

const RESOURCE_LINKS = [
  { href: "#faq", label: "FAQ" },
  { href: "#", label: "Help center" },
  { href: "#connections", label: "Broker connections" },
  { href: "#", label: "Dividend glossary" },
  { href: "#", label: "System status" },
] as const;

const LEGAL_LINKS = [
  { href: "#", label: "Privacy policy" },
  { href: "#", label: "Terms of service" },
  { href: "#", label: "Security" },
  { href: "#", label: "Disclosures" },
  { href: "#", label: "Cookie settings" },
] as const;

const SOCIAL_LINKS = [
  { href: "#", label: "X", icon: "/marketing/footer/icon-x.svg" },
  { href: "#", label: "LinkedIn", icon: "/marketing/footer/icon-linkedin.svg" },
  { href: "#", label: "Instagram", icon: "/marketing/footer/icon-instagram.svg" },
  { href: "#", label: "YouTube", icon: "/marketing/footer/icon-youtube.svg" },
  { href: "#", label: "Discord", icon: "/marketing/footer/icon-discord.svg" },
] as const;

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
export function SiteFooter() {
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
              <Link
                href="/"
                className="relative h-9 w-[118px] shrink-0 min-[1200px]:h-11 min-[1200px]:w-[146px]"
                aria-label="PaidPrime home"
              >
                <Image
                  src="/marketing/footer/logo.png"
                  alt="PaidPrime"
                  fill
                  className="object-contain object-left"
                  sizes="146px"
                />
              </Link>

              <p className="m-0 max-w-[320px] pt-3.5 text-[15px] leading-[24px] font-normal text-[#99a1ac] min-[1200px]:text-[16px] min-[1200px]:leading-[26px]">
                Real-time dividend alerts and portfolio
                <br className="hidden min-[1200px]:block" />{" "}
                intelligence for income investors. Built for
                <br className="hidden min-[1200px]:block" />{" "}
                people who care about every payment.
              </p>

              <div className="flex flex-col gap-2 pt-3.5">
                <a
                  href="mailto:support@paidprime.com"
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
                  support@paidprime.com
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
                  New York, NY
                </p>
              </div>

              <ul className="m-0 flex list-none flex-wrap gap-3 p-0 pt-[18px]">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className="flex size-12 items-center justify-center rounded-[14px] border border-[#2e343b] bg-[#121417] transition-colors hover:border-[#4c82f7]/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={social.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <FooterColumn title="Product" links={PRODUCT_LINKS} />
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Resources" links={RESOURCE_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          <div className="flex flex-col gap-3 border-t border-[#22262c] pt-8 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
            <p className="m-0 text-[14px] leading-[24px] text-[#6c737f] min-[1200px]:text-[15px] min-[1200px]:leading-[24.75px]">
              © 2026 PaidPrime. All rights reserved.
            </p>
            <p className="m-0 text-[14px] leading-[24px] text-[#6c737f] min-[1200px]:text-right min-[1200px]:text-[15px] min-[1200px]:leading-[24.75px]">
              Not investment advice. PaidPrime does not custody assets or execute
              trades.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
