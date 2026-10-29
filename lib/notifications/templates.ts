// Three user-selectable notification styles (Settings > Notifications >
// Notification style — components/dashboard/notification-style-picker.tsx).
// Each returns { push: {title, body}, telegram: text } so callers
// (app/api/jobs/detect-dividends/route.ts) don't duplicate copy between
// the two channels. Exactly one is sent per detected payment — there is
// no "primary + follow-up" pair the way this file worked before user
// choice existed.

export type NotificationStyle = "compact" | "descriptive" | "premium" | "discreet";
export type NotificationLocale = "en" | "pt";

export type TemplateContent = { push: { title: string; body: string }; telegram: string };

// ─── Compact ──────────────────────────────────────────────────────────────────

/** Compact — ticker and amount only, the shortest read. */
export function compactTemplate(
  ticker: string,
  amount: number,
  locale: NotificationLocale = "en",
): TemplateContent {
  if (locale === "pt") {
    return {
      push: { title: "Dividendo recebido", body: `${ticker} · +$${amount.toFixed(2)}` },
      telegram: `Dividendo recebido · ${ticker}\n+$${amount.toFixed(2)}`,
    };
  }
  return {
    push: { title: "Dividend received", body: `${ticker} · +$${amount.toFixed(2)}` },
    telegram: `Dividend received · ${ticker}\n+$${amount.toFixed(2)}`,
  };
}

// ─── Descriptive ──────────────────────────────────────────────────────────────

/**
 * Descriptive — confirms the money has actually landed, without naming a
 * specific broker. This is also Premium's honest fallback (see
 * buildNotificationContent) for any user who hasn't linked a broker, or
 * whose broker hasn't confirmed this specific payment yet.
 */
export function descriptiveTemplate(
  ticker: string,
  amount: number,
  locale: NotificationLocale = "en",
): TemplateContent {
  if (locale === "pt") {
    return {
      push: {
        title: "Dividendo recebido",
        body: `${ticker}\nRecebido +$${amount.toFixed(2)} · já na sua conta.`,
      },
      telegram: `Dividendo recebido · ${ticker}\nRecebido +$${amount.toFixed(2)} · já na sua conta.`,
    };
  }
  return {
    push: { title: "Dividend received", body: `${ticker}\nReceived +$${amount.toFixed(2)} · now in your account.` },
    telegram: `Dividend received · ${ticker}\nReceived +$${amount.toFixed(2)} · now in your account.`,
  };
}

// ─── Premium / Broker-confirmed ───────────────────────────────────────────────

/**
 * Premium — only reachable when loadBrokerDividends().confirms() found a
 * matching real transaction in a linked Plaid account. Never call this
 * with brokerConfirmed=false upstream; buildNotificationContent enforces
 * that so a "Premium" pick can't fabricate a confirmation that never
 * happened.
 */
export function brokerConfirmedTemplate(
  ticker: string,
  amount: number,
  brokerName: string | null,
  locale: NotificationLocale = "en",
): TemplateContent {
  if (locale === "pt") {
    const broker = brokerName?.trim() || "sua corretora vinculada";
    return {
      push: {
        title: "Dividendo confirmado",
        body: `${ticker} · +$${amount.toFixed(2)}\n${broker} · Pagamento confirmado ✓`,
      },
      telegram: `✅ Dividendo confirmado · ${ticker}\n+$${amount.toFixed(2)}\nConfirmado via histórico de transações de ${broker} — o valor já caiu na sua conta.`,
    };
  }
  const broker = brokerName?.trim() || "your linked broker";
  return {
    push: { title: "Dividend confirmed", body: `${ticker} · +$${amount.toFixed(2)}\n${broker} · Payment confirmed ✓` },
    telegram: `✅ Dividend confirmed · ${ticker}\n+$${amount.toFixed(2)}\nConfirmed via ${broker}'s transaction history — this has actually landed in your account.`,
  };
}

// ─── Discreet ─────────────────────────────────────────────────────────────────

/**
 * Discreet — amount only, no ticker. The user knows money arrived without
 * revealing which asset to anyone glancing at their lock screen.
 */
export function discreetTemplate(
  amount: number,
  locale: NotificationLocale = "en",
): TemplateContent {
  if (locale === "pt") {
    return {
      push: { title: "Dividendo recebido", body: `+$${amount.toFixed(2)} · Agora na sua conta` },
      telegram: `Dividendo recebido\n+$${amount.toFixed(2)} · Agora na sua conta`,
    };
  }
  return {
    push: { title: "Dividend received", body: `+$${amount.toFixed(2)} · Now in your account` },
    telegram: `Dividend received\n+$${amount.toFixed(2)} · Now in your account`,
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

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
  params: {
    ticker: string;
    amount: number;
    brokerName: string | null;
    brokerConfirmed: boolean;
    locale?: NotificationLocale;
  },
): TemplateContent {
  const { ticker, amount, brokerName, brokerConfirmed, locale = "en" } = params;
  if (style === "discreet") {
    return discreetTemplate(amount, locale);
  }
  if (style === "premium") {
    return brokerConfirmed
      ? brokerConfirmedTemplate(ticker, amount, brokerName, locale)
      : descriptiveTemplate(ticker, amount, locale);
  }
  if (style === "descriptive") {
    return descriptiveTemplate(ticker, amount, locale);
  }
  return compactTemplate(ticker, amount, locale);
}
