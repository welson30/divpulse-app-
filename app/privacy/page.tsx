import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — PaidPrime",
  description: "How PaidPrime collects, uses, discloses, and protects your personal information.",
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

export default function PrivacyPolicyPage() {
  return (
    <div className="pp-landing min-h-screen">
      <SiteHeader />
      <main className="border-b border-[#22262c] bg-[#0b0c0e]">
        <div className="mx-auto box-border w-full max-w-[1440px] px-4 py-14 sm:px-8 sm:py-16 min-[1200px]:px-[60px] min-[1200px]:py-20">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10 min-[1200px]:px-12">
            <header className="flex flex-col gap-3 border-b border-[#22262c] pb-8">
              <p className="m-0 text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Legal</p>
              <h1 className="pp-display m-0 text-[clamp(30px,6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f2f4f7]">
                Privacy Policy
              </h1>
              <p className="m-0 text-[15px] text-[#6c737f]">Effective date: August 9, 2026</p>
            </header>

            <Section title="1. Introduction">
              <p className={pClass}>
                Welcome to PaidPrime (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). PaidPrime is a SaaS
                platform operated by Deals Connect LLC that helps dividend investors track their portfolios, monitor
                passive income, and receive real-time alerts when dividend payments are detected. This Privacy Policy
                explains how we collect, use, disclose, and protect your personal information when you use our website
                at paidprime.com and our application (collectively, the &ldquo;Service&rdquo;).
              </p>
              <p className={pClass}>
                By accessing or using the Service, you agree to this Privacy Policy. If you do not agree, please do
                not use the Service.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p className={pClass}>2.1 Information You Provide</p>
              <Bullets
                items={[
                  "Account information: name, email address, and password when you register.",
                  "Portfolio data: tickers, number of shares, broker names, and any other investment information you manually enter.",
                  "Payment information: billing details processed securely by Stripe. We do not store your credit card numbers on our servers.",
                  "Communications: messages you send us via email or support channels.",
                ]}
              />
              <p className={pClass}>2.2 Information Collected Automatically</p>
              <Bullets
                items={[
                  "Usage data: pages visited, features used, time spent, and interactions with the Service.",
                  "Device information: IP address, browser type, operating system, and device identifiers.",
                  "Cookies and similar technologies: used to maintain sessions, remember preferences, and analyze usage.",
                ]}
              />
              <p className={pClass}>2.3 Information from Third-Party Services</p>
              <Bullets
                items={[
                  "Broker data (Pro+ plan only): if you connect your brokerage account via Plaid, we receive read-only access to your investment holdings. We do not have access to your login credentials.",
                  "Google authentication: if you sign in with Google, we receive your name and email address from Google.",
                ]}
              />
            </Section>

            <Section title="3. How We Use Your Information">
              <p className={pClass}>We use the information we collect to:</p>
              <Bullets
                items={[
                  "Provide, maintain, and improve the Service.",
                  "Send push notifications, Telegram alerts, and email notifications about dividend payments detected in your portfolio.",
                  "Process payments and manage your subscription.",
                  "Personalize your experience and generate AI-powered insights (Pro plan feature).",
                  "Communicate with you about your account, updates, and support requests.",
                  "Detect and prevent fraud, abuse, and security issues.",
                  "Comply with legal obligations.",
                ]}
              />
            </Section>

            <Section title="4. How We Share Your Information">
              <p className={pClass}>
                We do not sell your personal information. We may share your information only in the following
                circumstances:
              </p>
              <Bullets
                items={[
                  <>
                    Service providers: third-party companies that help us operate the Service, including Supabase
                    (database), Stripe (payments), Resend (email), Plaid (broker sync), OpenAI (AI features), Firebase
                    (push notifications), and Telegram (optional chat alerts, Pro/Pro+ plans). These providers are
                    contractually obligated to protect your data.
                  </>,
                  "Legal requirements: if required by law, court order, or government authority.",
                  "Business transfers: in connection with a merger, acquisition, or sale of assets, your information may be transferred.",
                  "With your consent: for any other purpose with your explicit permission.",
                ]}
              />
            </Section>

            <Section title="5. Data Retention">
              <p className={pClass}>
                We retain your personal information for as long as your account is active or as needed to provide the
                Service. If you delete your account, we will delete your personal data within 30 days, except where
                retention is required by law. Investment data synced via Plaid is used only to display your portfolio
                within the app and is not retained beyond the scope of the active session or your connected account.
              </p>
            </Section>

            <Section title="6. Data Security">
              <p className={pClass}>
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <Bullets
                items={[
                  "Encryption of data in transit (TLS/HTTPS).",
                  "Encryption of sensitive data at rest.",
                  "Row-level security policies in our database.",
                  "Secure, read-only broker connections via Plaid.",
                ]}
              />
              <p className={pClass}>
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute
                security of your data.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p className={pClass}>
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <Bullets
                items={[
                  "Access: request a copy of the personal data we hold about you.",
                  "Correction: request that we correct inaccurate or incomplete data.",
                  "Deletion: request that we delete your personal data (“right to be forgotten”).",
                  "Portability: request your data in a portable format.",
                  "Objection: object to certain types of processing.",
                  "Withdrawal of consent: withdraw consent where processing is based on consent.",
                ]}
              />
              <p className={pClass}>
                To exercise these rights, contact us at{" "}
                <a href="mailto:paidprime1@gmail.com" className="text-[#4c82f7] hover:underline">
                  paidprime1@gmail.com
                </a>
                . We will respond within 30 days.
              </p>
            </Section>

            <Section title="8. Cookies">
              <p className={pClass}>We use cookies and similar technologies to:</p>
              <Bullets
                items={[
                  "Keep you logged in to your account.",
                  "Remember your preferences (language, currency).",
                  "Analyze how the Service is used to improve it.",
                ]}
              />
              <p className={pClass}>
                You can control cookies through your browser settings. Disabling cookies may affect certain features
                of the Service.
              </p>
            </Section>

            <Section title="9. Children's Privacy">
              <p className={pClass}>
                PaidPrime is not directed to children under the age of 18. We do not knowingly collect personal
                information from minors. If you believe a minor has provided us with personal information, please
                contact us and we will delete it promptly.
              </p>
            </Section>

            <Section title="10. International Data Transfers">
              <p className={pClass}>
                PaidPrime is operated from the United States. If you are located outside the United States, your
                information may be transferred to and processed in the United States, where data protection laws may
                differ from those in your country. By using the Service, you consent to this transfer.
              </p>
              <p className={pClass}>
                For users in Brazil, we comply with the Lei Geral de Proteção de Dados (LGPD). For users in the
                European Economic Area, we comply with the General Data Protection Regulation (GDPR).
              </p>
            </Section>

            <Section title="11. Third-Party Links">
              <p className={pClass}>
                The Service may contain links to third-party websites. We are not responsible for the privacy
                practices of those sites and encourage you to review their privacy policies.
              </p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p className={pClass}>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by
                email or by posting a notice on the Service. The &ldquo;Effective date&rdquo; at the top of this
                policy indicates when it was last updated. Your continued use of the Service after changes are posted
                constitutes your acceptance of the updated policy.
              </p>
            </Section>

            <Section title="13. Contact Us">
              <p className={pClass}>
                If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:
              </p>
              <div className="flex flex-col gap-1 text-[16px] leading-[1.7] text-[#99a1ac]">
                <p className="m-0">Company: PaidPrime (DBA of Deals Connect LLC)</p>
                <p className="m-0">
                  Email:{" "}
                  <a href="mailto:paidprime1@gmail.com" className="text-[#4c82f7] hover:underline">
                    paidprime1@gmail.com
                  </a>
                </p>
                <p className="m-0">Website: https://www.paidprime.com</p>
                <p className="m-0">Address: FL, United States</p>
              </div>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
