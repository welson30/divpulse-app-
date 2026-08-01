import "server-only";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

/**
 * How many prior turns to replay to the model. The advisor is now a
 * persistent site-wide chat rather than a one-shot box, so follow-ups
 * ("what about at double that?") are the common case and need history to
 * resolve at all. Capped because every replayed turn is billed again on a
 * pay-per-query provider — 8 turns covers a normal back-and-forth without
 * letting a long session's cost grow without bound.
 */
export const MAX_HISTORY_TURNS = 8;

const SYSTEM_PROMPT = `You are PaidPrime's AI Advisor, a dividend-portfolio assistant embedded in the PaidPrime app. You answer questions about the user's dividend income, holdings, upcoming payments, diversification, and progress toward their stated goals (passive income, emergency reserve, financial freedom).

You are given the user's real portfolio data as context. Ground every answer in those numbers and never invent figures — if the context doesn't contain what's needed to answer, say so plainly and tell them which page of the app has it.

Payments marked "estimated" are projections from that ticker's own historical payment cadence, not announced dates. Never present an estimated date as confirmed; say "expected around" for those and "confirmed" only for dates marked as such.

Keep answers concise (2-4 sentences unless asked for detail), concrete, and actionable. Use plain text — no markdown headings or tables. You are not a licensed financial advisor: don't frame projections as guarantees, and don't give individualized buy/sell recommendations.`;

export type AdvisorHolding = {
  ticker: string;
  shares: number;
  value: number | null;
  annualIncome: number;
  sector: string | null;
};

export type AdvisorUpcomingPayment = {
  ticker: string;
  payDate: string;
  amount: number;
  source: "confirmed" | "estimated";
};

export type AdvisorContext = {
  portfolioValue: number;
  monthlyIncome: number;
  annualIncome: number;
  avgYieldPct: number;
  holdings: AdvisorHolding[];
  upcoming: AdvisorUpcomingPayment[];
  sectors: { sector: string; pct: number }[];
  goals: { type: string; targetAmount: number; monthlyContribution: number }[];
  /** Page the user is currently on, so answers can start where they're looking. */
  currentPage: string | null;
  /** Held tickers with no recorded dividend history — so the model doesn't read their $0 as a real cut. */
  tickersWithoutHistory: string[];
};

export type AdvisorTurn = { role: "user" | "assistant"; content: string };

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Flattens the portfolio into the plain-text block the model sees. Kept
 * as one function so what the model knows is auditable in a single place
 * rather than scattered across the route.
 */
function buildContextSummary(context: AdvisorContext): string {
  const lines: string[] = [
    `Portfolio value: ${money(context.portfolioValue)}`,
    `Dividend income: ${money(context.monthlyIncome)}/month (${money(context.annualIncome)}/year, trailing 12 months of recorded payments)`,
    `Average portfolio yield: ${context.avgYieldPct.toFixed(2)}%`,
  ];

  if (context.currentPage) {
    lines.push(`The user is currently viewing the ${context.currentPage} page.`);
  }

  if (context.holdings.length > 0) {
    lines.push("", `Holdings (${context.holdings.length}):`);
    for (const h of context.holdings) {
      const parts = [`${h.ticker}: ${h.shares} shares`];
      if (h.value != null) parts.push(`worth ${money(h.value)}`);
      parts.push(`${money(h.annualIncome)}/yr income`);
      if (h.sector) parts.push(h.sector);
      lines.push(`- ${parts.join(", ")}`);
    }
  }

  if (context.tickersWithoutHistory.length > 0) {
    lines.push(
      "",
      `No recorded dividend history (may be non-payers, or symbols the data provider can't resolve — do not treat as a dividend cut): ${context.tickersWithoutHistory.join(", ")}`,
    );
  }

  if (context.upcoming.length > 0) {
    lines.push("", "Upcoming payments (next 60 days):");
    for (const p of context.upcoming) {
      lines.push(`- ${p.ticker}: ${money(p.amount)} on ${p.payDate} (${p.source})`);
    }
  }

  if (context.sectors.length > 0) {
    lines.push("", `Allocation by sector: ${context.sectors.map((s) => `${s.sector} ${s.pct.toFixed(1)}%`).join(", ")}`);
  }

  if (context.goals.length > 0) {
    lines.push("", "Goals:");
    for (const g of context.goals) {
      lines.push(`- ${g.type}: target ${money(g.targetAmount)}, contributing ${money(g.monthlyContribution)}/mo`);
    }
  } else {
    lines.push("", "The user has not set any goals yet.");
  }

  return lines.join("\n");
}

/**
 * Whether a provider key is present. Checked by the route before doing any
 * portfolio work, so a deployment that simply hasn't been given a key
 * reports that plainly instead of surfacing as a generic "try again
 * shortly" the user could retry forever without it ever succeeding.
 */
export function isAdvisorConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Single non-streaming chat completion — no SDK, matches this codebase's plain-fetch pattern for Telegram/Yahoo Finance. */
export async function askAdvisor(question: string, context: AdvisorContext, history: AdvisorTurn[] = []): Promise<string> {
  if (!isAdvisorConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `User's current data:\n${buildContextSummary(context)}` },
        ...history.slice(-MAX_HISTORY_TURNS),
        { role: "user", content: question },
      ],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (!answer) {
    throw new Error("OpenAI returned no answer");
  }
  return answer;
}
