export const HELP_CATEGORIES = [
  { id: "getting-started", label: "Getting started" },
  { id: "brokers", label: "Brokers & syncing" },
  { id: "dividends", label: "Dividends & payments" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing & plans" },
  { id: "security", label: "Security" },
] as const;

export type HelpCategoryId = (typeof HELP_CATEGORIES)[number]["id"];

export type HelpArticle = {
  slug: string;
  title: string;
  category: HelpCategoryId;
  popular?: boolean;
  body: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "add-your-first-holding",
    title: "Add your first holding",
    category: "getting-started",
    body: [
      "Open Portfolio and use Add holding. Enter the ticker, share count, and optionally a broker name. PaidPrime then pulls quotes and dividend history for that symbol.",
      "Free plans can track up to 5 assets this way. Pro removes the cap. Pro+ also lets you import a CSV or connect a US broker through Plaid so holdings sync automatically.",
    ],
  },
  {
    slug: "what-the-dashboard-shows",
    title: "What the dashboard shows",
    category: "getting-started",
    body: [
      "The dashboard is a snapshot of the holdings you have today: current value from live quotes, trailing twelve-month income from recorded dividend events, and the next estimated payment.",
      "It is not cost-basis performance. We don't store what you paid for a share, so unrealized gain and yield-on-cost are not shown.",
    ],
  },
  {
    slug: "read-only-broker-syncing",
    title: "How does read-only broker syncing work?",
    category: "brokers",
    popular: true,
    body: [
      "Broker auto-sync is a Pro+ feature. You connect through Plaid Link, pick your US institution there, and Plaid issues PaidPrime a read-only access token.",
      "We encrypt that token at rest (AES-256-GCM) and never see your broker password. PaidPrime can read holdings — it cannot place trades or move funds.",
      "Disconnect anytime on Broker connections. That revokes the Plaid Item and removes holdings that came from that account.",
    ],
  },
  {
    slug: "connect-a-us-broker",
    title: "Connecting a US broker with Plaid",
    category: "brokers",
    body: [
      "Open Broker connections and use Connect. Plaid Link lists supported US institutions — PaidPrime does not connect to a named broker directly.",
      "Plaid in this app is US-only. Brokers outside the US can still be tracked manually or with a CSV import on Pro+.",
    ],
  },
  {
    slug: "dividend-pending",
    title: "Why is my dividend showing as pending?",
    category: "dividends",
    popular: true,
    body: [
      "On Upcoming payments, Pending means the pay date is already in our dividend calendar for a ticker you hold, and it hasn't been paid yet. Confirmed means Yahoo published an announced date. Expected is a projection from that ticker's own payment cadence — not an announced date.",
      "Pending is not a broker deposit confirmation. Broker-confirmed payouts only appear after a linked Plaid account shows a matching transaction, and only if that notification style is on.",
    ],
  },
  {
    slug: "export-dividend-history",
    title: "How to export my dividend history",
    category: "dividends",
    popular: true,
    body: [
      "Open Payment history and use Export CSV. That file is built from payments we've recorded for your holdings (or estimated from events × shares when a payment row isn't stored yet).",
      "Settings → Billing also has Download my data, which exports holdings, watchlist, and account fields — not broker access tokens.",
    ],
  },
  {
    slug: "telegram-notifications",
    title: "Setting up Telegram notifications",
    category: "notifications",
    popular: true,
    body: [
      "Telegram alerts are a Pro or Pro+ feature. Open Alert templates and connect Telegram. That opens our bot with a one-time code so the chat is tied to your account.",
      "You'll get a message when a dividend is detected for a ticker you hold. Disconnect anytime from the same screen.",
    ],
  },
  {
    slug: "notification-styles",
    title: "Notification styles and channels",
    category: "notifications",
    popular: true,
    body: [
      "Alert templates lets you pick compact, standard, or detailed copy for push, Telegram, and the bell menu. Push can be enabled on this device from that page.",
      "PaidPrime does not have quiet hours, email digests, or an archive. Those controls are not in the product — if you need a pause, disable push or disconnect Telegram.",
    ],
  },
  {
    slug: "plans-and-limits",
    title: "What's on Free, Pro, and Pro+",
    category: "billing",
    body: [
      "Free: up to 5 manually tracked assets, alerts, calendar, and allocation. Pro: unlimited manual tracking. Pro+: CSV import and Plaid broker sync.",
      "Prices shown at checkout are $59/yr for Pro and $119/yr for Pro+. Change or cancel in Settings → Billing, which opens the Stripe customer portal.",
    ],
  },
  {
    slug: "cancel-or-change-plan",
    title: "How to cancel or change your plan",
    category: "billing",
    body: [
      "Open Settings → Billing and Manage billing. Stripe handles invoices, cards, upgrades, and cancellation. Access stays through the period you already paid.",
      "If you haven't subscribed yet, there is no billing account to manage — use Subscription to start checkout.",
    ],
  },
  {
    slug: "brokerage-account-safety",
    title: "Is my brokerage account safe?",
    category: "security",
    body: [
      "Plaid connections are read-only. PaidPrime cannot withdraw, trade, or see your broker password. Access tokens are encrypted at rest.",
      "Manual and CSV holdings never involve a broker login. Revoke a connection on Broker connections and synced positions from that account stop updating immediately.",
    ],
  },
  {
    slug: "yield-on-cost",
    title: "Why PaidPrime doesn't show yield-on-cost",
    category: "security",
    popular: true,
    body: [
      "Yield-on-cost needs cost basis — what you paid per share. We don't store that, so we don't invent an unrealized gain or a yield-on-cost figure.",
      "Trailing yield on Analytics is trailing twelve-month income divided by recent portfolio value from price history, not yield-on-cost. Current yield on a holding uses trailing dividends per share over the latest quote.",
    ],
  },
];

export function articlesInCategory(id: HelpCategoryId) {
  return HELP_ARTICLES.filter((a) => a.category === id);
}

export function popularArticles() {
  return HELP_ARTICLES.filter((a) => a.popular);
}

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function searchHelpArticles(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(q) || a.body.some((p) => p.toLowerCase().includes(q)),
  );
}
