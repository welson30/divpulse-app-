import "server-only";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are PaidPrime's AI Advisor, embedded in the Goals & Financial Planning page of a dividend-tracking app. You answer questions about the user's dividend income, portfolio growth, and progress toward their stated goals (passive income, emergency reserve, financial freedom).

You are given the user's real portfolio numbers and goal settings as context — always ground your answer in those numbers, don't invent figures. Keep answers concise (2-4 sentences), concrete, and actionable. You are not a licensed financial advisor — don't give individualized investment recommendations framed as guarantees; frame projections as estimates based on current data.`;

export type AdvisorContext = {
  portfolioValue: number;
  monthlyIncome: number;
  avgYieldPct: number;
  goals: { type: string; targetAmount: number; monthlyContribution: number }[];
};

/** Single non-streaming chat completion — no SDK, matches this codebase's plain-fetch pattern for Telegram/Yahoo Finance. */
export async function askAdvisor(question: string, context: AdvisorContext): Promise<string> {
  const contextSummary = [
    `Current portfolio value: $${context.portfolioValue.toFixed(2)}`,
    `Current monthly dividend income: $${context.monthlyIncome.toFixed(2)}`,
    `Average portfolio yield: ${context.avgYieldPct.toFixed(2)}%`,
    ...context.goals.map((g) => `Goal (${g.type}): target $${g.targetAmount.toFixed(2)}, contributing $${g.monthlyContribution.toFixed(2)}/mo`),
  ].join("\n");

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
        { role: "system", content: `User's current data:\n${contextSummary}` },
        { role: "user", content: question },
      ],
      max_tokens: 300,
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
