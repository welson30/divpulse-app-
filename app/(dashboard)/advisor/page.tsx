import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { computeTrailingIncome, computeAnnualIncomeSeries } from "@/lib/dividend-data/income";
import {
  AdvisorBoard,
  type AdvisorInsight,
  type AdvisorRiskRow,
  type AdvisorSuggestion,
} from "@/components/dashboard/advisor/advisor-board";

export const metadata: Metadata = {
  title: "AI Advisor — PaidPrime",
};

const MAX_EVENT_ROWS = 5000;

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default async function AdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: holdings }, { data: watchlist }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
    supabase.from("holdings").select("ticker, shares").eq("user_id", user!.id),
    supabase.from("watchlist_items").select("ticker").eq("user_id", user!.id).order("added_at", { ascending: false }),
  ]);

  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";
  const list = holdings ?? [];
  const tickers = [...new Set(list.map((h) => h.ticker))];
  const held = new Set(tickers.map((t) => t.toUpperCase()));

  const [income, annual, quotes, collectionTickers, events] = await Promise.all([
    computeTrailingIncome(supabase, list),
    computeAnnualIncomeSeries(supabase, list, 3),
    tickers.length > 0
      ? getDividendDataProvider()
          .fetchQuotes(tickers)
          .catch(() => new Map())
      : Promise.resolve(new Map()),
    supabase.from("collection_tickers").select("ticker, sort_order").order("sort_order", { ascending: true }).limit(40),
    tickers.length > 0
      ? supabase
          .from("dividend_events")
          .select("ticker, pay_date, amount_per_share")
          .in("ticker", tickers)
          .gte(
            "pay_date",
            new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          )
          .limit(MAX_EVENT_ROWS)
      : Promise.resolve({ data: [] as { ticker: string; pay_date: string; amount_per_share: number }[] }),
  ]);

  let portfolioValue = 0;
  const valueBySector = new Map<string, number>();
  for (const holding of list) {
    const quote = quotes.get(holding.ticker.toUpperCase());
    const shares = Number(holding.shares);
    const value = quote?.price != null ? quote.price * shares : 0;
    portfolioValue += value;
    const sector = quote?.sector || quote?.quoteType || "Unclassified";
    valueBySector.set(sector, (valueBySector.get(sector) ?? 0) + value);
  }

  const insights: AdvisorInsight[] = [];
  const completeYears = annual.filter((p) => p.complete && p.total > 0);
  if (completeYears.length >= 2 && completeYears.at(-2)!.total > 0) {
    const yoy =
      ((completeYears.at(-1)!.total - completeYears.at(-2)!.total) / completeYears.at(-2)!.total) * 100;
    const highlight = formatPct(yoy);
    insights.push({
      icon: "trend",
      highlight,
      text: `Dividend income is ${yoy >= 0 ? "up" : "down"} ${highlight} year over year, from recorded calendar-year payments.`,
    });
  } else if (income.annual > 0) {
    insights.push({
      icon: "trend",
      highlight: formatMoney(income.annual),
      text: `Trailing 12-month dividend income is ${formatMoney(income.annual)}.`,
    });
  }

  let topTicker: string | null = null;
  let topIncome = 0;
  for (const [ticker, amount] of income.perTicker) {
    if (amount > topIncome) {
      topIncome = amount;
      topTicker = ticker;
    }
  }
  if (topTicker && topIncome > 0) {
    insights.push({
      icon: "sparkle",
      highlight: topTicker,
      text: `${topTicker} is your largest income contributor at ${formatMoney(topIncome)}/yr trailing.`,
    });
  }

  const suggestions: AdvisorSuggestion[] = [];
  for (const row of watchlist ?? []) {
    const ticker = row.ticker.toUpperCase();
    if (held.has(ticker) || suggestions.some((s) => s.ticker === ticker)) continue;
    suggestions.push({ ticker, href: `/tickers/${encodeURIComponent(ticker)}` });
    if (suggestions.length >= 3) break;
  }
  if (suggestions.length < 3) {
    for (const row of collectionTickers.data ?? []) {
      const ticker = row.ticker.toUpperCase();
      if (held.has(ticker) || suggestions.some((s) => s.ticker === ticker)) continue;
      suggestions.push({ ticker, href: `/tickers/${encodeURIComponent(ticker)}` });
      if (suggestions.length >= 3) break;
    }
  }

  const risks: AdvisorRiskRow[] = [];
  if (list.length > 0) {
    const sectors = [...valueBySector.entries()].sort((a, b) => b[1] - a[1]);
    const top = sectors[0];
    if (top && portfolioValue > 0) {
      const pct = (top[1] / portfolioValue) * 100;
      risks.push({
        title: "Concentration risk",
        detail: `${pct.toFixed(0)}% in ${top[0]}`,
        tone: pct >= 30 ? "warning" : pct >= 20 ? "neutral" : "positive",
      });
    }

    const namedSectors = sectors.filter(([label, value]) => label !== "Unclassified" && value > 0);
    const sectorCount = namedSectors.length || sectors.length;
    risks.push({
      title: "Sector overlap",
      detail:
        sectorCount <= 1
          ? "Holdings sit in a single sector"
          : `Spread across ${sectorCount} sectors — correlation not measured`,
      tone: sectorCount <= 1 ? "warning" : sectorCount <= 3 ? "neutral" : "positive",
    });

    const ttmStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ttm = new Map<string, number>();
    const prior = new Map<string, number>();
    for (const event of events.data ?? []) {
      const ticker = event.ticker.toUpperCase();
      const amount = Number(event.amount_per_share);
      if (event.pay_date >= ttmStart) ttm.set(ticker, (ttm.get(ticker) ?? 0) + amount);
      else prior.set(ticker, (prior.get(ticker) ?? 0) + amount);
    }
    let raised = 0;
    let comparable = 0;
    for (const ticker of tickers) {
      const current = ttm.get(ticker.toUpperCase()) ?? 0;
      const previous = prior.get(ticker.toUpperCase()) ?? 0;
      if (current > 0 && previous > 0) {
        comparable += 1;
        if (current > previous) raised += 1;
      }
    }
    risks.push({
      title: "Distribution stability",
      detail:
        comparable > 0
          ? `${raised}/${comparable} holdings paid more per share than the prior year`
          : "Not enough prior-year payout history to compare",
      tone:
        comparable === 0
          ? "neutral"
          : raised / comparable >= 0.6
            ? "positive"
            : raised / comparable >= 0.4
              ? "neutral"
              : "warning",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AdvisorBoard isPro={isPro} insights={insights} suggestions={suggestions} risks={risks} />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
