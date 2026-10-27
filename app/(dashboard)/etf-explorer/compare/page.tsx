import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { enrichTickers } from "@/lib/tickers/enrich";
import { getYieldPct } from "@/lib/tickers/yield";
import { TICKER_FREQUENCY } from "@/lib/etf-explorer/curated-lists";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { EtfComparePicker } from "@/components/dashboard/etf-compare-picker";

export const metadata: Metadata = {
  title: "Compare ETFs — PaidPrime",
};

export const revalidate = 300;

type Props = { searchParams: Promise<{ tickers?: string }> };

function fmt(price: number | null, currency: string | null) {
  if (!price) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(price);
}

function fmtYield(y: number | null) {
  if (!y) return "—";
  return `${(y * 100).toFixed(2)}%`;
}

function fmtIncome(invest: number, y: number | null) {
  if (!y) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    invest * y
  );
}

const INVEST_AMOUNTS = [1_000, 5_000, 10_000, 25_000];

const FREQ_COLOR: Record<string, string> = {
  Monthly: "text-blue-400",
  Quarterly: "text-violet-400",
  Weekly: "text-amber-400",
};

export default async function EtfComparePage({ searchParams }: Props) {
  const { tickers: raw } = await searchParams;

  // Parse up to 3 tickers from ?tickers=JEPI,SCHD,O
  const tickers = (raw ?? "")
    .toUpperCase()
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 3);

  const validTickers = tickers.length > 0 ? tickers : ["JEPI", "SCHD", "O"];

  const enriched = await enrichTickers(validTickers, "1mo");

  const cols = validTickers.map((ticker) => {
    const e = enriched.get(ticker);
    const yieldPct = getYieldPct(e?.quote);
    return {
      ticker,
      name: e?.name ?? null,
      logoUrl: e?.logoUrl ?? null,
      price: e?.quote?.price ?? null,
      currency: e?.quote?.currency ?? null,
      yieldPct,
      changePercent: e?.quote?.changePercent ?? null,
      frequency: TICKER_FREQUENCY[ticker] ?? null,
      exDividendDate: e?.quote?.exDividendDate ?? null,
    };
  });

  // Find the best in each metric for highlighting
  const bestYield = Math.max(...cols.map((c) => (c.yieldPct ? c.yieldPct * 100 : 0)));
  const lowestPrice = Math.min(...cols.map((c) => c.price ?? Infinity));

  return (
    <div className="flex flex-col gap-sp-6">
      {/* Back */}
      <Link
        href="/etf-explorer"
        className="flex w-fit items-center gap-1 font-mono text-xs text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        ETF Explorer
      </Link>

      {/* Header */}
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Compare</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">ETF Comparator</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add up to 3 ETFs by ticker to compare them side by side.
        </p>
      </div>

      {/* Interactive ticker picker */}
      <EtfComparePicker tickers={validTickers} />

      {/* Comparison grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
      >
        {cols.map((col) => {
          const isBestYield = col.yieldPct != null && Math.abs(col.yieldPct * 100 - bestYield) < 0.001;
          const isCheapest = col.price != null && col.price === lowestPrice;
          return (
            <div
              key={col.ticker}
              className={`flex flex-col gap-4 rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-lg ${
                isBestYield ? "border-green-500/40" : "border-border-subtle"
              }`}
            >
              {/* Ticker header */}
              <div className="flex flex-col items-center gap-3 text-center">
                <TickerLogo ticker={col.ticker} logoUrl={col.logoUrl} size="lg" />
                <div>
                  <div className="font-mono text-xl font-bold text-text-primary">{col.ticker}</div>
                  <div className="mt-0.5 text-xs text-text-secondary">{col.name ?? "—"}</div>
                  {col.frequency && (
                    <div className={`mt-1.5 font-mono text-xs font-semibold ${FREQ_COLOR[col.frequency] ?? "text-text-secondary"}`}>
                      {col.frequency} dividends
                    </div>
                  )}
                </div>
                {isBestYield && (
                  <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-green-400 uppercase">
                    Highest Yield
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle" />

              {/* Stats */}
              <div className="flex flex-col gap-3">
                <Stat label="Price" value={fmt(col.price, col.currency)} highlight={isCheapest} />
                <Stat
                  label="Dividend Yield"
                  value={fmtYield(col.yieldPct)}
                  highlight={isBestYield}
                  valueClass="text-green-400"
                />
                <Stat
                  label="Today"
                  value={
                    col.changePercent != null
                      ? `${col.changePercent >= 0 ? "+" : ""}${col.changePercent.toFixed(2)}%`
                      : "—"
                  }
                  valueClass={
                    col.changePercent == null
                      ? "text-text-secondary"
                      : col.changePercent >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                />
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle" />

              {/* Income at different investment levels */}
              <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                  Annual Income
                </div>
                {INVEST_AMOUNTS.map((amt) => (
                  <div key={amt} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-text-secondary">
                      ${amt.toLocaleString()}
                    </span>
                    <span className="font-mono text-xs font-semibold text-green-400">
                      {fmtIncome(amt, col.yieldPct)}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={`/tickers/${col.ticker}`}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-border-interactive py-2.5 font-sans text-xs font-semibold text-text-primary transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
              >
                View {col.ticker}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  valueClass,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-text-secondary">{label}</span>
      <span
        className={`font-mono text-sm font-semibold tabular-nums ${highlight ? "text-text-primary" : (valueClass ?? "text-text-primary")}`}
      >
        {value}
      </span>
    </div>
  );
}
