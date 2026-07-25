// The three notification templates named in PRD §4 / ARCHITECTURE.md §3:
// "ticker + amount, total account balance update, broker-confirmed
// payout." Each template returns { push: {title, body}, telegram: text }
// so callers (app/api/jobs/detect-dividends/route.ts) don't duplicate
// copy between the two channels.

export type TemplateContent = { push: { title: string; body: string }; telegram: string };

/** Template 1 — the original/default template, unconditional on every detected dividend. */
export function tickerAmountTemplate(ticker: string, amount: number, brokerName: string | null): TemplateContent {
  const broker = brokerName?.trim() || "Unspecified broker";
  return {
    push: { title: "Dividend received", body: `${ticker} · +$${amount.toFixed(2)}` },
    telegram: `Dividend received · ${ticker}\n+$${amount.toFixed(2)}\n${broker} · Payment confirmed ✓`,
  };
}

/** Template 2 — running lifetime total, sent as a follow-up alongside template 1/3 on every event (never standalone). */
export function balanceUpdateTemplate(lifetimeTotal: number): TemplateContent {
  const formatted = `$${lifetimeTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return {
    push: { title: "Dividend income update", body: `Total dividend income to date: ${formatted}` },
    telegram: `📊 Total dividend income to date: ${formatted}`,
  };
}

/** Template 3 — only sent when findBrokerConfirmedDeposit() found a matching real transaction; replaces template 1, not additive. */
export function brokerConfirmedTemplate(ticker: string, amount: number, brokerName: string | null): TemplateContent {
  const broker = brokerName?.trim() || "your linked broker";
  return {
    push: { title: "Dividend confirmed by your broker", body: `${ticker} · +$${amount.toFixed(2)} — confirmed at ${broker}` },
    telegram: `✅ Dividend confirmed · ${ticker}\n+$${amount.toFixed(2)}\nConfirmed via ${broker}'s transaction history — this has actually landed in your account.`,
  };
}
