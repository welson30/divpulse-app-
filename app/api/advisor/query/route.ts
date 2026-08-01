import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDividendDataProvider } from "@/lib/dividend-data";
import type { TickerQuote } from "@/lib/dividend-data/types";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { estimateUpcomingPayments } from "@/lib/dividend-data/next-payment";
import { streamAdvisor, isAdvisorConfigured, MAX_HISTORY_TURNS, type AdvisorHolding, type AdvisorTurn } from "@/lib/advisor/openai";

// ARCHITECTURE.md §12: "both candidate providers are pay-per-use ... a
// per-plan rate limit is needed before this ships, not after." 10/day is
// a starting point, not a spec'd number — cheap to raise once real usage
// patterns are known.
const DAILY_QUERY_LIMIT = 10;

/** How far ahead to tell the advisor about — matches the dashboard's own horizon. */
const UPCOMING_WINDOW_DAYS = 60;

/** Sectors below this share of the portfolio are folded away rather than listed individually. */
const MIN_SECTOR_PCT = 1;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    question?: string;
    history?: AdvisorTurn[];
    page?: string;
  };
  const trimmedQuestion = body.question?.trim();

  if (!trimmedQuestion) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (trimmedQuestion.length > 500) {
    return NextResponse.json({ error: "Keep questions under 500 characters." }, { status: 400 });
  }

  // Checked before any auth/portfolio work: without a provider key every
  // request is doomed, and saying so plainly beats a generic failure the
  // user would keep retrying. 503, not 502 — nothing upstream is broken,
  // this deployment just hasn't been configured yet.
  if (!isAdvisorConfigured()) {
    console.error("[advisor] OPENAI_API_KEY is not set — the advisor cannot answer any question until it is.");
    return NextResponse.json({ error: "The AI Advisor isn't configured on this deployment yet." }, { status: 503 });
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

  // Rate limiting runs through the service-role client, as the
  // ai_advisor_queries migration always intended ("written exclusively by
  // ... the service-role client"). It previously used the request-scoped
  // anon client, whose INSERT is rejected by RLS — that table grants only
  // SELECT. The failure was silent (the insert result was never checked),
  // so the log stayed empty, today's count was permanently 0, and the
  // daily cap never once fired on a pay-per-query provider.
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: queriesToday } = await admin
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

  const heldHoldings = holdings ?? [];
  const distinctTickers = [...new Set(heldHoldings.map((h) => h.ticker))];

  // One batched request for the whole portfolio rather than the previous
  // per-ticker fetchQuote loop — same reasoning as lib/tickers/enrich.ts.
  const provider = getDividendDataProvider();
  const quoteByTicker: Map<string, TickerQuote> = distinctTickers.length
    ? await provider.fetchQuotes(distinctTickers).catch(() => new Map<string, TickerQuote>())
    : new Map();

  const rangeStart = new Date().toISOString().slice(0, 10);
  const rangeEnd = new Date(Date.now() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Income comes from recorded dividend history, never from Yahoo's
  // trailingAnnualDividendYield. This route used to derive income from
  // that field, which reads 0.00% for most of the ETFs this product
  // exists to track — so the advisor was stating income roughly 14x too
  // low while the system prompt instructed it to "ground your answer in
  // those numbers." Wrong figures in confident prose are worse than a
  // wrong stat card; see lib/dividend-data/income.ts for the full note.
  const [income, upcoming] = await Promise.all([
    computeTrailingIncome(supabase, heldHoldings),
    distinctTickers.length ? estimateUpcomingPayments(supabase, distinctTickers, rangeStart, rangeEnd) : Promise.resolve([]),
  ]);

  const sharesByTicker = new Map<string, number>();
  for (const holding of heldHoldings) {
    sharesByTicker.set(holding.ticker, (sharesByTicker.get(holding.ticker) ?? 0) + Number(holding.shares));
  }

  let portfolioValue = 0;
  const valueBySector = new Map<string, number>();
  const advisorHoldings: AdvisorHolding[] = [];

  for (const [ticker, shares] of sharesByTicker) {
    const quote = quoteByTicker.get(ticker.toUpperCase()) ?? quoteByTicker.get(ticker);
    const value = quote?.price ? shares * quote.price : null;
    if (value != null) portfolioValue += value;

    const sector = quote?.sector ?? quote?.quoteType ?? null;
    if (value != null && sector) {
      valueBySector.set(sector, (valueBySector.get(sector) ?? 0) + value);
    }

    advisorHoldings.push({
      ticker,
      shares,
      value,
      annualIncome: income.perTicker.get(ticker) ?? 0,
      sector,
    });
  }

  // Largest positions first — if the list is ever truncated for a very
  // large portfolio, the meaningful ones survive.
  advisorHoldings.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const sectors =
    portfolioValue > 0
      ? [...valueBySector.entries()]
          .map(([sector, value]) => ({ sector, pct: (value / portfolioValue) * 100 }))
          .filter((s) => s.pct >= MIN_SECTOR_PCT)
          .sort((a, b) => b.pct - a.pct)
      : [];

  const avgYieldPct = portfolioValue > 0 ? (income.annual / portfolioValue) * 100 : 0;

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((turn) => (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 2000) }));

  const generator = streamAdvisor(
    trimmedQuestion,
    {
      portfolioValue,
      monthlyIncome: income.monthly,
      annualIncome: income.annual,
      avgYieldPct,
      holdings: advisorHoldings,
      upcoming: upcoming.map((p) => ({
        ticker: p.ticker,
        payDate: p.payDate,
        amount: p.amountPerShare * (sharesByTicker.get(p.ticker) ?? 0),
        source: p.source,
      })),
      sectors,
      goals: (goals ?? []).map((g) => ({
        type: g.goal_type,
        targetAmount: Number(g.target_amount),
        monthlyContribution: Number(g.monthly_contribution),
      })),
      currentPage: typeof body.page === "string" ? body.page.slice(0, 40) : null,
      tickersWithoutHistory: income.tickersWithoutHistory,
    },
    history,
  );

  // An async generator function body doesn't run until the first .next()
  // call, so pulling one chunk here is what actually sends the request to
  // OpenAI and lets a rejection (bad key, provider outage, empty answer)
  // still come back as an ordinary JSON error with a real HTTP status —
  // exactly like the old non-streaming version did. Only once that first
  // chunk is in hand are we committed to a 200 streamed response.
  let firstChunk: IteratorResult<string, void>;
  try {
    firstChunk = await generator.next();
  } catch (err) {
    console.error("[advisor] provider call failed:", err);
    return NextResponse.json({ error: "The advisor is unavailable right now — try again shortly." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  let fullAnswer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!firstChunk.done) {
          fullAnswer += firstChunk.value;
          controller.enqueue(encoder.encode(firstChunk.value));
        }
        while (true) {
          const { done, value } = await generator.next();
          if (done) break;
          fullAnswer += value;
          controller.enqueue(encoder.encode(value));
        }
      } catch (err) {
        // The HTTP status is already committed to 200 by this point (the
        // headers went out with the first enqueue), so a mid-stream
        // failure can't become an error response — the best that's left
        // is a readable note appended to whatever text the user already
        // saw, same as ChatGPT's own occasional cut-off streams.
        console.error("[advisor] stream interrupted:", err);
        controller.enqueue(encoder.encode("\n\n[Connection interrupted — please try again.]"));
      } finally {
        controller.close();

        // Checked, not fire-and-forget: an unlogged query is an unmetered
        // one, and silently dropping this write is exactly how the daily
        // cap came to be inert before. Logged even for a partial/cut-off
        // answer — the tokens were still spent.
        if (fullAnswer) {
          const { error: logError } = await admin
            .from("ai_advisor_queries")
            .insert({ user_id: user.id, prompt: trimmedQuestion, response: fullAnswer });
          if (logError) {
            console.error("[advisor] failed to log query — daily rate limit is not being counted:", logError);
          }
        }
      }
    },
    cancel() {
      // The client navigated away or aborted — stop pulling from OpenAI
      // rather than paying for tokens nobody will read.
      generator.return?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
