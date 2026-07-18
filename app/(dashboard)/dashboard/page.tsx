import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard — PaidPrime",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase
    .from("holdings")
    .select("id, ticker, shares")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const holdingCount = holdings?.length ?? 0;
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {holdingCount === 0
            ? "Add your first holding to start tracking dividend income."
            : `${holdingCount} ${holdingCount === 1 ? "asset" : "assets"} tracked.`}
        </p>
      </div>

      {holdingCount === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="max-w-sm text-sm text-text-secondary">
            No holdings yet. Add a ticker to start tracking dividend income.
          </p>
          <Button asChild className="h-10">
            <Link href="/holdings">Add first holding</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-card border border-warning/25 bg-[rgba(251,191,36,0.08)] p-sp-3">
            <p className="text-sm text-text-secondary">
              Live prices and dividend detection aren&rsquo;t connected yet — this dashboard currently shows your
              tracked positions only.
            </p>
          </div>

          <div className="flex flex-col gap-sp-2">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 font-display font-medium text-text-primary">Recent holdings</h2>
              <Link href="/holdings" className="font-mono text-xs text-green-500 hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-sp-2 sm:grid-cols-2">
              {holdings!.map((holding) => (
                <div key={holding.id} className="rounded-card border border-border-subtle bg-surface p-sp-3">
                  <div className="font-mono text-sm font-semibold text-text-primary">{holding.ticker}</div>
                  <div className="mt-1 font-mono text-xs text-text-secondary">{holding.shares} shares</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
