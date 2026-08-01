import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { MarketStateBadge } from "@/components/dashboard/market-stats";
import { TickerDetailActions } from "@/components/dashboard/ticker-detail-actions";
import type { TickerQuote } from "@/lib/dividend-data/types";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** U+2212 minus sign, matching the convention already used in market-stats.tsx's StatCard. */
function signed(n: number, digits = 2) {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;
}

const QUOTE_TYPE_LABELS: Record<string, string> = {
  EQUITY: "Stock",
  ETF: "ETF",
  MUTUALFUND: "Fund",
};

/** Square-ish tinted tag — the app's own established tag vocabulary (see ChipRow in components/marketing/product-tabs.tsx), not a bordered pill. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-surface-hover px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </span>
  );
}

function ChangeRow({
  amount,
  percent,
  isUp,
  size = "base",
}: {
  amount: number | null;
  percent: number | null;
  isUp: boolean;
  size?: "base" | "sm";
}) {
  return (
    <span
      className={`flex flex-wrap items-center gap-1 font-mono tabular-nums ${size === "sm" ? "text-xs" : "text-sm"} ${isUp ? "text-green-500" : "text-red-500"}`}
    >
      <span aria-hidden>{isUp ? "▲" : "▼"}</span>
      {amount != null ? <span>{signed(amount)}</span> : null}
      {percent != null ? <span>({signed(percent)}%)</span> : null}
    </span>
  );
}

export function TickerDetailHeader({
  quote,
  logoUrl,
  isWatched,
}: {
  quote: TickerQuote;
  logoUrl: string | null;
  isWatched: boolean;
}) {
  const isUp = (quote.changePercent ?? quote.change ?? 0) >= 0;
  const hasChange = quote.change != null || quote.changePercent != null;

  // Only one side is ever populated (see TickerQuote's doc comment) —
  // whichever matches the current session.
  const isPre = quote.marketState === "PRE" || quote.marketState === "PREPRE";
  const isPost = quote.marketState === "POST" || quote.marketState === "POSTPOST";
  const extendedLabel = isPre ? "Pre-market" : isPost ? "After hours" : null;
  const extendedPrice = isPre ? quote.preMarketPrice : isPost ? quote.postMarketPrice : null;
  const extendedChange = isPre ? quote.preMarketChange : isPost ? quote.postMarketChange : null;
  const extendedChangePercent = isPre ? quote.preMarketChangePercent : isPost ? quote.postMarketChangePercent : null;
  const extendedIsUp = (extendedChangePercent ?? extendedChange ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-sp-3 rounded-card border border-border-subtle bg-surface p-sp-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-sp-3">
        <div className="flex min-w-0 items-center gap-sp-2">
          <TickerLogo ticker={quote.ticker} logoUrl={logoUrl} size="lg" />
          <div className="min-w-0">
            <h1 className="font-mono text-xl font-bold tracking-tight text-text-primary">{quote.ticker}</h1>
            <p className="mt-0.5 max-w-[36ch] truncate text-sm text-text-secondary">{quote.name ?? "—"}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {quote.quoteType ? <Tag>{QUOTE_TYPE_LABELS[quote.quoteType] ?? quote.quoteType}</Tag> : null}
              {quote.currency ? <Tag>{quote.currency === "USD" ? "US" : quote.currency}</Tag> : null}
              <MarketStateBadge marketState={quote.marketState} delayMinutes={quote.exchangeDelayMinutes} />
            </div>
          </div>
        </div>

        <TickerDetailActions ticker={quote.ticker} companyName={quote.name} initiallyWatched={isWatched} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-text-primary sm:text-3xl">
            {formatMoney(quote.price)}
          </span>
          {hasChange ? (
            <span className="flex flex-wrap items-baseline gap-1">
              <ChangeRow amount={quote.change} percent={quote.changePercent} isUp={isUp} />
              <span className="font-mono text-sm text-text-secondary">Today</span>
            </span>
          ) : null}
        </div>

        {extendedLabel && extendedPrice != null ? (
          <div className="flex flex-wrap items-baseline gap-1.5 font-mono text-sm text-text-secondary">
            <span>
              {extendedLabel}: {formatMoney(extendedPrice)}
            </span>
            <ChangeRow amount={extendedChange} percent={extendedChangePercent} isUp={extendedIsUp} size="sm" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
