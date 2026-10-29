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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.paidprime.com";

/** Shared HTML shell used by all transactional emails. */
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PaidPrime</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <img src="${SITE_URL}/marketing/dashboard/logo.svg" alt="PaidPrime" width="120" height="auto"
                   style="display:block;" />
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#111113;border:1px solid #27272a;border-radius:12px;padding:36px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                PaidPrime · Real-time dividend tracking<br />
                <a href="${SITE_URL}" style="color:#3fbf87;text-decoration:none;">${SITE_URL.replace("https://", "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to PaidPrime 🎉",
    html: emailShell(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f4f4f5;">
        You're in. Let's track some dividends.
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        PaidPrime monitors your holdings and sends you a real-time alert the moment a
        dividend hits — push, Telegram, or email. You'll never miss a payment again.
      </p>
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#f4f4f5;">
        Get started in 3 steps:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:6px 0;">
            <span style="color:#3fbf87;font-weight:700;margin-right:8px;">1.</span>
            <span style="color:#a1a1aa;font-size:14px;">Add your holdings (ticker + shares)</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <span style="color:#3fbf87;font-weight:700;margin-right:8px;">2.</span>
            <span style="color:#a1a1aa;font-size:14px;">Enable push notifications in Settings</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <span style="color:#3fbf87;font-weight:700;margin-right:8px;">3.</span>
            <span style="color:#a1a1aa;font-size:14px;">Sit back and get paid</span>
          </td>
        </tr>
      </table>
      <a href="${SITE_URL}/holdings"
         style="display:inline-block;background:#3fbf87;color:#09090b;font-size:14px;font-weight:700;
                padding:12px 28px;border-radius:8px;text-decoration:none;">
        Add your first holding →
      </a>
    `),
  });
}

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro+",
};

export async function sendPaymentConfirmationEmail(to: string, plan: "pro" | "pro_plus", amount: number) {
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const amountFormatted = `$${(amount / 100).toFixed(2)}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You're on PaidPrime ${planLabel} ✅`,
    html: emailShell(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f4f4f5;">
        Payment confirmed.
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        You're now on <strong style="color:#f4f4f5;">PaidPrime ${planLabel}</strong>.
        Everything is active — no setup needed.
      </p>
      <!-- Receipt row -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#1a1a1d;border:1px solid #27272a;border-radius:8px;
                    padding:16px 20px;margin-bottom:28px;">
        <tr>
          <td style="font-size:13px;color:#71717a;">Plan</td>
          <td align="right" style="font-size:13px;color:#f4f4f5;font-weight:600;">
            PaidPrime ${planLabel}
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;font-size:13px;color:#71717a;">Amount charged</td>
          <td align="right" style="padding-top:10px;font-size:13px;color:#3fbf87;font-weight:700;">
            ${amountFormatted}
          </td>
        </tr>
      </table>
      <a href="${SITE_URL}/dashboard"
         style="display:inline-block;background:#3fbf87;color:#09090b;font-size:14px;font-weight:700;
                padding:12px 28px;border-radius:8px;text-decoration:none;">
        Go to dashboard →
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#52525b;">
        Questions? Reply to this email or visit our help center.
      </p>
    `),
  });
}
