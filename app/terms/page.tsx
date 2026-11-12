import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Terms of Service — PaidPrime",
  description: "Terms and conditions governing your use of PaidPrime.",
};

const h2Class =
  "pp-display m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#f2f4f7] sm:text-[26px]";
const pClass = "m-0 text-[16px] leading-[1.7] font-normal text-[#99a1ac]";
const ulClass = "m-0 flex list-none flex-col gap-2 p-0";
const liClass = "flex gap-2.5 text-[16px] leading-[1.7] font-normal text-[#99a1ac]";
const bulletClass = "mt-[11px] size-1.5 shrink-0 rounded-full bg-[#4c82f7]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[#22262c] pt-8 first:border-t-0 first:pt-0">
      <h2 className={h2Class}>{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className={ulClass}>
      {items.map((item, i) => (
        <li key={i} className={liClass}>
          <span className={bulletClass} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="pp-landing flex min-h-dvh flex-col bg-[#0b0c0e]">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-10 px-5 py-16 sm:px-8 sm:py-20">
        {/* Hero */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[2.5px] text-[#4c82f7] uppercase">
            Legal
          </p>
          <h1 className="pp-display m-0 text-[clamp(32px,6vw,48px)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#f2f4f7]">
            Terms of Service
          </h1>
          <p className={pClass}>
            Last updated: January 1, 2025. These Terms of Service ("Terms") govern your access to
            and use of PaidPrime ("Service"). By creating an account or using the Service, you agree
            to these Terms.
          </p>
        </div>

        <Section title="1. Description of Service">
          <p className={pClass}>
            PaidPrime is a dividend tracking and portfolio analytics platform that helps investors
            monitor income from dividend-paying securities. The Service provides informational
            dashboards, income projections, and portfolio tools. It is not a registered investment
            adviser and does not provide personalized investment advice.
          </p>
        </Section>

        <Section title="2. Accounts and Eligibility">
          <Bullets
            items={[
              "You must be at least 18 years old to create an account.",
              "You are responsible for maintaining the confidentiality of your account credentials.",
              "You may not share your account with others or create accounts for the purpose of circumventing plan limits.",
              "You agree to provide accurate information when registering.",
            ]}
          />
        </Section>

        <Section title="3. Plans and Payments">
          <p className={pClass}>
            PaidPrime offers Free, Pro, and Pro+ subscription plans. Paid plans are billed through
            Stripe on a recurring basis.
          </p>
          <Bullets
            items={[
              "Subscriptions renew automatically until cancelled.",
              "You may cancel at any time through the billing portal in Settings. Cancellation takes effect at the end of the current billing period.",
              "Refunds are not provided for unused portions of a billing period.",
              "We reserve the right to change pricing with 30 days' notice.",
            ]}
          />
        </Section>

        <Section title="4. Acceptable Use">
          <p className={pClass}>You agree not to:</p>
          <Bullets
            items={[
              "Use the Service for any unlawful purpose or in violation of these Terms.",
              "Attempt to reverse engineer, scrape, or extract data from the Service at scale.",
              "Interfere with or disrupt the integrity or performance of the Service.",
              "Create multiple free accounts to exceed plan limits.",
              "Share, resell, or redistribute data obtained from the Service.",
            ]}
          />
        </Section>

        <Section title="5. Data and Third-Party Integrations">
          <p className={pClass}>
            PaidPrime may integrate with third-party services including Plaid (for brokerage account
            linking), Stripe (for payments), and financial data providers. Your use of these
            integrations is subject to those providers' own terms and privacy policies. Market data
            displayed in the Service is for informational purposes and may be delayed.
          </p>
        </Section>

        <Section title="6. Disclaimers">
          <p className={pClass}>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            PAIDPRIME DOES NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR TIMELINESS OF ANY
            FINANCIAL DATA DISPLAYED. NOTHING IN THE SERVICE CONSTITUTES INVESTMENT, TAX, OR
            FINANCIAL ADVICE. PAST DIVIDEND HISTORY IS NOT A GUARANTEE OF FUTURE PAYMENTS.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p className={pClass}>
            To the maximum extent permitted by law, PaidPrime shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including loss of profits, data,
            or goodwill, arising out of or in connection with your use of the Service.
          </p>
        </Section>

        <Section title="8. Termination">
          <p className={pClass}>
            We may suspend or terminate your account at any time for violation of these Terms. You
            may delete your account at any time through Settings. Upon termination, your right to use
            the Service ceases immediately.
          </p>
        </Section>

        <Section title="9. Changes to These Terms">
          <p className={pClass}>
            We may update these Terms from time to time. We will notify you of material changes by
            email or by posting a notice in the Service. Continued use after changes take effect
            constitutes acceptance.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className={pClass}>
            Questions about these Terms? Contact us at{" "}
            <a
              href="mailto:support@paidprime.com"
              className="text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]"
            >
              support@paidprime.com
            </a>
            .
          </p>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
