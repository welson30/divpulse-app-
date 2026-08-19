import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { AllocationDonut } from "@/components/dashboard/allocation-donut";
import { ALLOC_COLORS } from "@/lib/allocation-colors";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import { FigmaIcon } from "@/components/dashboard/figma-icon";

export const metadata: Metadata = {
  title: "Allocation — PaidPrime",
};

function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function classifyAsset(quoteType: string | null, sector: string | null, name: string | null, ticker: string) {
  const type = (quoteType ?? "").toUpperCase();
  const blob = `${name ?? ""} ${ticker} ${sector ?? ""}`.toLowerCase();
  if (blob.includes("preferred") || type.includes("PREFERRED")) return "Preferred Shares";
  if (type === "ETF") return "ETFs";
  if (type === "MUTUALFUND") return "Mutual funds";
  if ((sector ?? "").toLowerCase().includes("real estate") || /\breit\b/.test(blob)) return "REITs";
  if (type === "EQUITY") return "Individual Equities";
  if (type) return type;
  return "Unknown";
}

function sectorLabel(quoteType: string | null, sector: string | null) {
  if (sector) return sector;
  if (quoteType === "ETF") return "ETF";
  if (quoteType === "MUTUALFUND") return "Mutual fund";
  if (quoteType === "EQUITY") return "Equity";
  return quoteType || "Unknown";
}

type NamedValue = { label: string; value: number; color: string; pct: number };

function toRows(map: Map<string, number>, total: number): NamedValue[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: ALLOC_COLORS[i % ALLOC_COLORS.length]!,
      pct: total > 0 ? (value / total) * 100 : 0,
    }));
}

export default async function DiversificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, broker_name, company_name")
    .eq("user_id", user!.id);

  const header = (
    <header className="border-b border-[#22262c] pb-6">
      <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Allocation</p>
      <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
        Portfolio allocation
      </h1>
      <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
        How your capital is spread across sectors, asset classes and brokers.
      </p>
    </header>
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center text-sm text-[#99a1ac]">
          Add a holding to see how your portfolio is spread out.
        </div>
      </div>
    );
  }

  const provider = getDividendDataProvider();
  const distinctTickers = [...new Set(holdings.map((h) => h.ticker))];
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
  const unpricedTickers = distinctTickers.filter((t) => !quoteByTicker.get(t)?.price);

  const byBroker = new Map<string, number>();
  const brokerLabels = new Map<string, string>();
  const bySector = new Map<string, number>();
  const byAsset = new Map<string, number>();

  for (const holding of holdings) {
    const quote = quoteByTicker.get(holding.ticker);
    const shares = Number(holding.shares);

    // A holding with no live price is skipped, not valued at its share
    // count. Substituting the count mixes units — measured on a real
    // portfolio, two rows of an unpriced option contract at 10,000 shares
    // each contributed $20,000 of phantom "value" and made up 40% of this
    // chart, pushing every genuine position's weight down by roughly the
    // same proportion (KO read 1.8% instead of 3.0%).
    if (!quote?.price) continue;
    const value = shares * quote.price;

    const brokerRaw = holding.broker_name?.trim() || "Unspecified";
    const brokerKey = brokerRaw.toLowerCase();
    byBroker.set(brokerKey, (byBroker.get(brokerKey) ?? 0) + value);
    if (!brokerLabels.has(brokerKey)) brokerLabels.set(brokerKey, brokerRaw);

    const sector = sectorLabel(quote?.quoteType ?? null, quote?.sector ?? null);
    bySector.set(sector, (bySector.get(sector) ?? 0) + value);

    const asset = classifyAsset(
      quote?.quoteType ?? null,
      quote?.sector ?? null,
      quote?.name ?? holding.company_name,
      holding.ticker,
    );
    byAsset.set(asset, (byAsset.get(asset) ?? 0) + value);
  }

  const portfolioValue = [...bySector.values()].reduce((sum, v) => sum + v, 0);
  const sectorRows = toRows(bySector, portfolioValue);
  const assetRows = toRows(byAsset, portfolioValue);
  const brokerRows = toRows(byBroker, portfolioValue).map((row) => ({
    ...row,
    label: brokerLabels.get(row.label) ?? row.label,
  }));
  const namedBrokerCount = brokerRows.filter((r) => r.label !== "Unspecified").length;

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <section className="rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Sector allocation
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Hover a slice or a legend row</p>
          </header>
          <div className="px-6 py-8">
            <AllocationDonut segments={sectorRows} />
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Asset class breakdown
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Weight by instrument type</p>
            </header>
            <div className="flex flex-col gap-5 p-6">
              {assetRows.map((row) => {
                // Floor the drawn width so a real but small slice still reads as a
                // line instead of a sub-pixel sliver; a true 0% stays empty. The
                // label keeps a decimal below 1% so it can't render as "0%" next
                // to a visible bar.
                const barWidth = row.pct > 0 ? Math.min(100, Math.max(row.pct, 1.5)) : 0;
                return (
                  <div key={row.label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-[#f2f4f7]">{row.label}</span>
                      <span className="text-[13px] tracking-[-0.26px] text-[#99a1ac]">
                        {row.pct >= 1 ? row.pct.toFixed(0) : row.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#16191d]">
                      <div className="h-2 rounded-full" style={{ width: `${barWidth}%`, background: row.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Sector allocation
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Detail by holdings weight</p>
            </header>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(5rem,0.6fr)_minmax(6rem,0.7fr)] border-b border-[#22262c] px-6 py-3 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">
                  <span>Sector</span>
                  <span className="text-right">Weight</span>
                  <span className="text-right">Value</span>
                </div>
                {sectorRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[minmax(0,1.6fr)_minmax(5rem,0.6fr)_minmax(6rem,0.7fr)] items-center px-6 py-3.5 ${
                      i < sectorRows.length - 1 ? "border-b border-[#22262c]" : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="size-2.5 shrink-0 rounded-[6px]" style={{ background: row.color }} />
                      <span className="truncate text-[14px] text-[#99a1ac]">{row.label}</span>
                    </span>
                    <span className="text-right text-[14px] tracking-[-0.28px] text-[#f2f4f7]">{row.pct.toFixed(0)}%</span>
                    <span className="text-right text-[14px] tracking-[-0.28px] text-[#f2f4f7]">{formatMoney(row.value, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="border-b border-[#22262c] px-6 py-5">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            Broker allocation
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Capital custody across connected brokerages</p>
        </header>
        <div className="overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(9rem,0.9fr)] border-b border-[#22262c] px-6 py-3 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">
              <span>Broker</span>
              <span className="text-right">Value</span>
              <span className="text-right">Weight</span>
            </div>
            {brokerRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(9rem,0.9fr)] items-center pr-6 ${
                  i < brokerRows.length - 1 ? "border-b border-[#22262c]" : ""
                }`}
              >
                <div className="px-6 py-4">
                  <BrokerMark name={row.label} />
                </div>
                <div className="px-6 py-4 text-right text-[14px] tracking-[-0.28px] text-[#f2f4f7]">
                  {formatMoney(row.value)}
                </div>
                <div className="flex items-center justify-end gap-2 py-4 pl-6">
                  <div className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#16191d]">
                    <div className="h-1.5 rounded-full bg-[#4c82f7]" style={{ width: `${Math.min(100, row.pct)}%` }} />
                  </div>
                  <span className="w-12 text-right text-[12px] tracking-[-0.24px] text-[#6c737f]">{row.pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-[#22262c] px-6 py-4">
          <FigmaIcon src="/marketing/dashboard/icon-clock.svg" className="size-[14px] text-[#6c737f]" />
          <p className="text-[12px] leading-[19.8px] text-[#6c737f]">
            {namedBrokerCount} {namedBrokerCount === 1 ? "brokerage account" : "brokerage accounts"} connected
          </p>
        </div>
      </section>

      {unpricedTickers.length > 0 ? (
        <p className="text-sm text-[#99a1ac]">
          No live price for {unpricedTickers.join(", ")} — {unpricedTickers.length === 1 ? "that position is" : "those positions are"}{" "}
          left out of the weightings above so the percentages stay in dollars.
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
