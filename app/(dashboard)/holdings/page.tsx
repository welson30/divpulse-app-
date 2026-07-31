import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDividendDataProvider } from "@/lib/dividend-data";
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

  // Two batched requests cover the whole table regardless of how many
  // holdings there are — see fetchQuotes/fetchSparklines in
  // lib/dividend-data/yahoo-finance.ts. Failures degrade to a table
  // without prices rather than breaking the page.
  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const provider = getDividendDataProvider();
  const [quotes, sparklines] = await Promise.all([
    provider.fetchQuotes(tickers).catch(() => new Map()),
    provider.fetchSparklines(tickers, "1mo").catch(() => new Map()),
  ]);

  const rows: Holding[] = (holdings ?? []).map((h) => {
    const quote = quotes.get(h.ticker.toUpperCase());
    const shares = Number(h.shares);
    return {
      ...h,
      name: quote?.name ?? h.company_name ?? null,
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      marketValue: quote?.price != null ? quote.price * shares : null,
      sparkline: sparklines.get(h.ticker.toUpperCase()) ?? [],
    };
  });

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap items-center justify-between gap-sp-2">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Holdings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {count} {count === 1 ? "asset" : "assets"} tracked{isFree ? ` · Free plan limit: 5` : ""}
          </p>
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
