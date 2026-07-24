import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { askAdvisor } from "@/lib/advisor/openai";

// ARCHITECTURE.md §12: "both candidate providers are pay-per-use ... a
// per-plan rate limit is needed before this ships, not after." 10/day is
// a starting point, not a spec'd number — cheap to raise once real usage
// patterns are known.
const DAILY_QUERY_LIMIT = 10;

export async function POST(request: NextRequest) {
  const { question } = (await request.json()) as { question?: string };
  const trimmedQuestion = question?.trim();

  if (!trimmedQuestion) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (trimmedQuestion.length > 500) {
    return NextResponse.json({ error: "Keep questions under 500 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  // AI Advisor is a Pro/Pro+ feature (ARCHITECTURE.md §7) — checked
  // server-side against profiles.plan, never a client-visible flag, same
  // reasoning as the Telegram gate in the detection cron job.
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";
  if (!isPro) {
    return NextResponse.json({ error: "The AI Advisor is a Pro feature. Upgrade in Settings to use it." }, { status: 403 });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: queriesToday } = await supabase
    .from("ai_advisor_queries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString());

  if ((queriesToday ?? 0) >= DAILY_QUERY_LIMIT) {
    return NextResponse.json({ error: `You've reached today's limit of ${DAILY_QUERY_LIMIT} questions. Try again tomorrow.` }, { status: 429 });
  }

  const [{ data: holdings }, { data: goals }] = await Promise.all([
    supabase.from("holdings").select("ticker, shares").eq("user_id", user.id),
    supabase.from("goals").select("goal_type, target_amount, monthly_contribution").eq("user_id", user.id),
  ]);

  const provider = getDividendDataProvider();
  const distinctTickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const quotes = await Promise.all(
    distinctTickers.map(async (ticker) => {
      try {
        return await provider.fetchQuote(ticker);
      } catch {
        return null;
      }
    }),
  );
  const quoteByTicker = new Map(distinctTickers.map((ticker, i) => [ticker, quotes[i]]));

  let portfolioValue = 0;
  let annualIncome = 0;
  for (const holding of holdings ?? []) {
    const quote = quoteByTicker.get(holding.ticker);
    const shares = Number(holding.shares);
    const value = quote?.price ? shares * quote.price : 0;
    portfolioValue += value;
    if (quote?.trailingAnnualDividendYield) {
      annualIncome += value * quote.trailingAnnualDividendYield;
    }
  }
  const avgYieldPct = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0;

  let answer: string;
  try {
    answer = await askAdvisor(trimmedQuestion, {
      portfolioValue,
      monthlyIncome: annualIncome / 12,
      avgYieldPct,
      goals: (goals ?? []).map((g) => ({
        type: g.goal_type,
        targetAmount: Number(g.target_amount),
        monthlyContribution: Number(g.monthly_contribution),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "The advisor is unavailable right now — try again shortly." }, { status: 502 });
  }

  await supabase.from("ai_advisor_queries").insert({ user_id: user.id, prompt: trimmedQuestion, response: answer });

  return NextResponse.json({ answer });
}
