import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { enrichTickers } from "@/lib/tickers/enrich";
import { MarketStateBadge } from "@/components/dashboard/market-stats";
import { HoldingsTable, type Holding } from "@/components/dashboard/holdings-table";
import { AddHoldingDialog } from "@/components/dashboard/add-holding-dialog";
import { ImportCsvDialog } from "@/components/dashboard/import-csv-dialog";

export const metadata: Metadata = {
  title: "Holdings — PaidPrime",
};

export default async function HoldingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: holdings }, { data: profile }] = await Promise.all([
    supabase
      .from("holdings")
      .select("id, ticker, company_name, broker_name, shares, source")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
  ]);

  const isFree = (profile?.plan ?? "free") === "free";
  const isProPlus = profile?.plan === "pro_plus";
  const count = holdings?.length ?? 0;

  // Two batched requests cover the whole table however many holdings
  // there are — see lib/tickers/enrich.ts. Failures degrade to a table
  // without prices rather than breaking the page.
  const enriched = await enrichTickers((holdings ?? []).map((h) => h.ticker));

  const rows: Holding[] = (holdings ?? []).map((h) => {
    const info = enriched.get(h.ticker.toUpperCase());
    const quote = info?.quote;
    const shares = Number(h.shares);
    return {
      ...h,
      name: info?.name ?? h.company_name ?? null,
      logoUrl: info?.logoUrl ?? null,
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      marketValue: quote?.price != null ? quote.price * shares : null,
      sparkline: info?.sparkline ?? [],
    };
  });

  // Any holding's quote carries the exchange status; they're all US
  // markets, so the first one that resolved speaks for the table.
  const marketQuote = [...enriched.values()].find((e) => e.quote?.marketState)?.quote ?? null;

  const totalValue = rows.reduce((sum, r) => sum + (r.marketValue ?? 0), 0);

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap items-center justify-between gap-sp-2">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Holdings</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            <span>
              {count} {count === 1 ? "asset" : "assets"} tracked{isFree ? ` · Free plan limit: 5` : ""}
            </span>
            {totalValue > 0 ? (
              <span className="font-mono tabular-nums text-text-primary">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : null}
            <MarketStateBadge
              marketState={marketQuote?.marketState}
              delayMinutes={marketQuote?.exchangeDelayMinutes}
            />
          </div>
        </div>
        <div className="flex gap-sp-2">
          <ImportCsvDialog isProPlus={isProPlus} />
          <AddHoldingDialog />
        </div>
      </div>

      <HoldingsTable holdings={rows} />
    </div>
  );
}
