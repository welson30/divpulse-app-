import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;

/** Single Resend SDK instance, server-only — mirrors lib/stripe/client.ts's getStripe() pattern. */
function getResend(): Resend {
  if (resend) return resend;
  resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

const FROM = `PaidPrime <${process.env.RESEND_FROM_EMAIL ?? "noreply@paidprime.com"}>`;

export async function sendWelcomeEmail(to: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to PaidPrime",
    html: `
      <p>Welcome to PaidPrime — you're all set.</p>
      <p>Add your first holding to start tracking dividends, and we'll alert you the moment one is paid.</p>
    `,
  });
}

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro+",
};

export async function sendPaymentConfirmationEmail(to: string, plan: "pro" | "pro_plus", amount: number) {
  const planLabel = PLAN_LABELS[plan] ?? plan;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You're on PaidPrime ${planLabel}`,
    html: `
      <p>Payment confirmed — you're now on the PaidPrime ${planLabel} plan.</p>
      <p>Amount charged: $${(amount / 100).toFixed(2)}</p>
    `,
  });
}
