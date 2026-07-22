import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DiversificationDonut } from "@/components/dashboard/diversification-donut";

export const metadata: Metadata = {
  title: "Diversification — PaidPrime",
};

export default async function DiversificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, broker_name")
    .eq("user_id", user!.id);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Diversification</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to see how your portfolio is spread out.</p>
        </div>
      </div>
    );
  }

  const byTicker = new Map<string, number>();
  const byBroker = new Map<string, number>();

  for (const holding of holdings) {
    byTicker.set(holding.ticker, (byTicker.get(holding.ticker) ?? 0) + Number(holding.shares));
    const broker = holding.broker_name?.trim() || "Unspecified";
    byBroker.set(broker, (byBroker.get(broker) ?? 0) + Number(holding.shares));
  }

  const tickerSegments = [...byTicker.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  const brokerSegments = [...byBroker.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Diversification</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Weighted by shares held — live prices aren&rsquo;t connected yet, so this reflects position size, not
          dollar value.
        </p>
      </div>

      <div className="grid gap-sp-3 md:grid-cols-2">
        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By holding</h2>
          <DiversificationDonut segments={tickerSegments} />
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-sp-4">
          <h2 className="mb-sp-3 text-h2 font-display font-medium text-text-primary">By broker</h2>
          <DiversificationDonut segments={brokerSegments} />
        </div>
      </div>

      <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <p className="text-sm text-text-secondary">
          Sector and asset-type breakdowns need live market data we haven&rsquo;t wired up yet — coming alongside
          Collections.
        </p>
      </div>
    </div>
  );
}
