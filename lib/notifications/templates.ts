// Three user-selectable notification styles (Settings > Notifications >
// Notification style — components/dashboard/notification-style-picker.tsx).
// Each returns { push: {title, body}, telegram: text } so callers
// (app/api/jobs/detect-dividends/route.ts) don't duplicate copy between
// the two channels. Exactly one is sent per detected payment — there is
// no "primary + follow-up" pair the way this file worked before user
// choice existed.

export type NotificationStyle = "compact" | "descriptive" | "premium";

export type TemplateContent = { push: { title: string; body: string }; telegram: string };

/** Compact — ticker and amount only, the shortest read. */
export function compactTemplate(ticker: string, amount: number): TemplateContent {
  return {
    push: { title: "Dividend received", body: `${ticker} · +$${amount.toFixed(2)}` },
    telegram: `Dividend received · ${ticker}\n+$${amount.toFixed(2)}`,
  };
}

/**
 * Descriptive — confirms the money has actually landed, without naming a
 * specific broker. This is also Premium's honest fallback (see
 * buildNotificationContent) for any user who hasn't linked a broker, or
 * whose broker hasn't confirmed this specific payment yet.
 */
export function descriptiveTemplate(ticker: string, amount: number): TemplateContent {
  return {
    push: { title: "Dividend received", body: `${ticker}\nReceived +$${amount.toFixed(2)} · now in your account.` },
    telegram: `Dividend received · ${ticker}\nReceived +$${amount.toFixed(2)} · now in your account.`,
  };
}

/**
 * Premium — only reachable when loadBrokerDividends().confirms() found a
 * matching real transaction in a linked Plaid account. Never call this
 * with brokerConfirmed=false upstream; buildNotificationContent enforces
 * that so a "Premium" pick can't fabricate a confirmation that never
 * happened.
 */
export function brokerConfirmedTemplate(ticker: string, amount: number, brokerName: string | null): TemplateContent {
  const broker = brokerName?.trim() || "your linked broker";
  return {
    push: { title: "Dividend confirmed", body: `${ticker} · +$${amount.toFixed(2)}\n${broker} · Payment confirmed ✓` },
    telegram: `✅ Dividend confirmed · ${ticker}\n+$${amount.toFixed(2)}\nConfirmed via ${broker}'s transaction history — this has actually landed in your account.`,
  };
}

/**
 * Single entry point the detection job (and the Settings picker's live
 * preview) both call — the one place that decides what a user's chosen
 * style actually renders as for a given event.
 *
 * Premium degrades to Descriptive, not to a fabricated confirmation, when
 * brokerConfirmed is false: a user who picked the richest style but has no
 * linked broker (or whose broker hasn't posted the transaction yet) should
 * see an honest "received" message, never an invented "confirmed at
 * Fidelity ✓" for a confirmation that doesn't exist.
 */
export function buildNotificationContent(
  style: NotificationStyle,
  params: { ticker: string; amount: number; brokerName: string | null; brokerConfirmed: boolean },
): TemplateContent {
  const { ticker, amount, brokerName, brokerConfirmed } = params;
  if (style === "premium") {
    return brokerConfirmed ? brokerConfirmedTemplate(ticker, amount, brokerName) : descriptiveTemplate(ticker, amount);
  }
  if (style === "descriptive") {
    return descriptiveTemplate(ticker, amount);
  }
  return compactTemplate(ticker, amount);
}
