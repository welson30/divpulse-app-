import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { computeTrailingIncome } from "@/lib/dividend-data/income";
import { resolveLogoUrl } from "@/lib/tickers/logo";
import type { TickerQuote } from "@/lib/dividend-data/types";
import { TickerDetailHeader } from "@/components/dashboard/ticker-detail-header";
import { TickerChartSection } from "@/components/dashboard/ticker-chart-section";
import { KeyStatsGrid } from "@/components/dashboard/key-stats-grid";
import { DividendHistoryTable, type DividendHistoryRow } from "@/components/dashboard/dividend-history-table";
import { YourPositionCard, type PositionHolding } from "@/components/dashboard/your-position-card";

// Matches the constraint TickerSearchCombobox already enforces (maxLength={10}).
const TICKER_PATTERN = /^[A-Z0-9.\-]{1,10}$/;

type TickerDetailPageProps = { params: Promise<{ ticker: string }> };

export async function generateMetadata({ params }: TickerDetailPageProps): Promise<Metadata> {
  const { ticker } = await params;
  return { title: `${ticker.trim().toUpperCase()} — PaidPrime` };
}

export default async function TickerDetailPage({ params }: TickerDetailPageProps) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.trim().toUpperCase();

  // notFound() only fires for malformed input, never because Yahoo has no
  // data for an otherwise well-formed ticker — an upstream outage or an
  // obscure/delisted symbol must render the page with dashes, not a 404,
  // matching the never-throw philosophy already in enrichTickers/fetchQuotes.
  if (!TICKER_PATTERN.test(ticker)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const provider = getDividendDataProvider();

  const [quoteDetail, quotesMap, priceHistory, holdingsResult, watchlistResult, dividendResult, profileResult] = await Promise.all([
    provider.fetchQuote(ticker),
    provider.fetchQuotes([ticker]),
    provider.fetchPriceHistory(ticker, "6mo"),
    supabase.from("holdings").select("id, shares, broker_name").eq("user_id", user!.id).eq("ticker", ticker),
    supabase.from("watchlist_items").select("id").eq("user_id", user!.id).eq("ticker", ticker).maybeSingle(),
    supabase
      .from("dividend_events")
      .select("ex_date, pay_date, amount_per_share")
      .eq("ticker", ticker)
      .order("pay_date", { ascending: false })
      .limit(500),
    supabase.from("profiles").select("default_broker_name").eq("id", user!.id).single(),
  ]);

  const depthQuote = quotesMap.get(ticker) ?? null;

  // Merge: fetchQuotes (batch endpoint) carries market-depth fields
  // (day/52wk range, volume, marketState) that fetchQuote's chart-sourced
  // base always leaves null; fetchQuote alone reaches quoteSummary for
  // sector + the deep-stats fields (marketCap, P/E, payout ratio, etc.).
  // Neither call is guaranteed to succeed, so build from whichever
  // fields are actually present rather than requiring both to land.
  const quote: TickerQuote = {
    ticker,
    price: depthQuote?.price ?? quoteDetail?.price ?? null,
    currency: depthQuote?.currency ?? quoteDetail?.currency ?? null,
    sector: quoteDetail?.sector ?? null,
    quoteType: depthQuote?.quoteType ?? quoteDetail?.quoteType ?? null,
    trailingAnnualDividendYield: quoteDetail?.trailingAnnualDividendYield ?? depthQuote?.trailingAnnualDividendYield ?? null,
    dividendYieldPercent: depthQuote?.dividendYieldPercent ?? null,
    name: depthQuote?.name ?? quoteDetail?.name ?? null,
    change: depthQuote?.change ?? quoteDetail?.change ?? null,
    changePercent: depthQuote?.changePercent ?? quoteDetail?.changePercent ?? null,
    marketState: depthQuote?.marketState ?? null,
    exchangeDelayMinutes: depthQuote?.exchangeDelayMinutes ?? null,
    exchangeName: depthQuote?.exchangeName ?? null,
    previousClose: depthQuote?.previousClose ?? quoteDetail?.previousClose ?? null,
    open: depthQuote?.open ?? null,
    dayLow: depthQuote?.dayLow ?? null,
    dayHigh: depthQuote?.dayHigh ?? null,
    fiftyTwoWeekLow: depthQuote?.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: depthQuote?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekChangePercent: depthQuote?.fiftyTwoWeekChangePercent ?? null,
    fiftyDayAverage: depthQuote?.fiftyDayAverage ?? null,
    twoHundredDayAverage: depthQuote?.twoHundredDayAverage ?? null,
    volume: depthQuote?.volume ?? null,
    averageVolume3Month: depthQuote?.averageVolume3Month ?? null,
    marketCap: quoteDetail?.marketCap ?? null,
    trailingPE: quoteDetail?.trailingPE ?? null,
    forwardPE: quoteDetail?.forwardPE ?? null,
    payoutRatio: quoteDetail?.payoutRatio ?? null,
    beta: quoteDetail?.beta ?? null,
    priceToBook: quoteDetail?.priceToBook ?? null,
    dividendRate: quoteDetail?.dividendRate ?? null,
    exDividendDate: quoteDetail?.exDividendDate ?? null,
    netAssets: depthQuote?.netAssets ?? null,
    netExpenseRatio: depthQuote?.netExpenseRatio ?? null,
    postMarketPrice: depthQuote?.postMarketPrice ?? null,
    postMarketChange: depthQuote?.postMarketChange ?? null,
    postMarketChangePercent: depthQuote?.postMarketChangePercent ?? null,
    preMarketPrice: depthQuote?.preMarketPrice ?? null,
    preMarketChange: depthQuote?.preMarketChange ?? null,
    preMarketChangePercent: depthQuote?.preMarketChangePercent ?? null,
  };

  const logoUrl = resolveLogoUrl(quote.name, ticker);

  const holdingsRows = holdingsResult.data ?? [];
  const isHeld = holdingsRows.length > 0;
  const isWatched = watchlistResult.data != null;

  const trailingIncome = isHeld
    ? (await computeTrailingIncome(supabase, holdingsRows.map((h) => ({ ticker, shares: h.shares })))).annual
    : 0;

  const positionHoldings: PositionHolding[] = holdingsRows.map((h) => ({
    shares: Number(h.shares),
    brokerName: h.broker_name,
  }));
  const totalShares = holdingsRows.reduce((sum, h) => sum + Number(h.shares), 0);

  const dividendEvents: DividendHistoryRow[] = (dividendResult.data ?? []).map((e) => ({
    payDate: e.pay_date,
    exDate: e.ex_date,
    amountPerShare: Number(e.amount_per_share),
  }));

  return (
    <div className="flex flex-col gap-sp-2 lg:gap-sp-4">
      <TickerDetailHeader
        quote={quote}
        logoUrl={logoUrl}
        isWatched={isWatched}
        defaultBroker={profileResult.data?.default_broker_name ?? undefined}
      />

      {/*
        A single grid with explicit per-item placement, not two flex-col
        "column" wrappers — that would let mobile's single-column collapse
        put the entire Dividend History table before "Your position,"
        which buries the personal-portfolio info the client actually
        wants to see first, under the general market data. `order` gives
        mobile the market-info-first, personal-info-second, deep-dive-last
        sequence; explicit col/row-start recreates the same two-column
        split as before once there's room for it at `lg:`.
      */}
      <div className="grid grid-cols-1 gap-sp-2 lg:grid-cols-[1.6fr_1fr] lg:gap-sp-3">
        <div className="order-1 lg:order-0 lg:col-start-1 lg:row-start-1">
          <TickerChartSection
            ticker={ticker}
            initialRange="6mo"
            initialPoints={priceHistory}
            isUp={(quote.changePercent ?? quote.change ?? 0) >= 0}
            quote={quote}
          />
        </div>

        {isHeld ? (
          <div className="order-2 border-t border-border-subtle pt-sp-2 lg:order-0 lg:col-start-2 lg:row-start-1 lg:border-t-0 lg:pt-0">
            <YourPositionCard
              holdings={positionHoldings}
              price={quote.price}
              previousClose={quote.previousClose}
              trailingIncome={trailingIncome}
              dividendYieldPercent={quote.dividendYieldPercent}
            />
          </div>
        ) : null}

        <div className="order-3 flex flex-col gap-sp-2 lg:order-0 lg:col-start-2 lg:row-start-2">
          <h2 className="text-h2 font-display font-medium text-text-primary">Key stats</h2>
          <KeyStatsGrid quote={quote} />
        </div>

        <div className="order-4 flex flex-col gap-sp-2 lg:order-0 lg:col-start-1 lg:row-start-2">
          <h2 className="text-h2 font-display font-medium text-text-primary">Dividend history</h2>
          <DividendHistoryTable events={dividendEvents} shares={isHeld ? totalShares : undefined} />
        </div>
      </div>
    </div>
  );
}
