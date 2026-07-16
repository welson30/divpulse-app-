const FAQ_ITEMS = [
  {
    q: "How fast is the alert, really?",
    a: "A scheduled job checks confirmed dividend data against every ticker you hold, continuously. The moment a payment is detected, the notification goes out — typically before your broker's own app surfaces the deposit. Most brokers never send a dividend notification at all.",
  },
  {
    q: "Is my brokerage account safe?",
    a: "Broker connections run through Plaid and are read-only — DivPulse can see holdings, never touch them. There is no ability to move funds or place trades, on any plan. If you track manually or by CSV import, no broker login is involved at all.",
  },
  {
    q: "My broker isn't a US broker. Does DivPulse work?",
    a: "Yes. Manual tracking works with any broker on earth — XP, Avenue, Nomad, or a local broker we've never heard of. Pro+ adds CSV import so you can bulk-load positions straight from your broker's export instead of typing them.",
  },
  {
    q: "Where do the alerts arrive?",
    a: "Push notification (DivPulse installs to your home screen on iOS and Android), Telegram message, and email — any combination you switch on. Each alert names the ticker, the amount, and the broker it landed in.",
  },
  {
    q: "What does the free plan actually include?",
    a: "Up to 5 tracked assets with manual entry, dividend alerts, the dashboard, the payment calendar, and the diversification view. No card, no trial clock — it stays free.",
  },
  {
    q: "Can I cancel a paid plan?",
    a: "Anytime. Plans are billed annually and your access runs to the end of the period you paid for. Downgrading to Free keeps your first 5 assets tracked.",
  },
];

/**
 * Objection handling for a money product — security, broker coverage,
 * cancellation — placed after pricing where those questions actually get
 * asked. Native <details>/<summary>: keyboard-accessible and functional
 * with zero JavaScript.
 */
export function Faq() {
  return (
    <div className="mx-auto w-full max-w-[720px] divide-y divide-border-subtle border-y border-border-subtle">
      {FAQ_ITEMS.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-sp-2 py-sp-3 text-[15px] font-medium text-text-primary transition-colors hover:text-green-500 [&::-webkit-details-marker]:hidden">
            {item.q}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              aria-hidden
              className="size-4 shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-45"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </summary>
          <p className="max-w-[62ch] pb-sp-3 text-sm leading-relaxed text-text-secondary">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
