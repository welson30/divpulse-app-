import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HoldingsTable, type Holding } from "@/components/dashboard/holdings-table";
import { AddHoldingDialog } from "@/components/dashboard/add-holding-dialog";

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
  const count = holdings?.length ?? 0;

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
        <AddHoldingDialog />
      </div>

      <HoldingsTable holdings={(holdings ?? []) as Holding[]} />
    </div>
  );
}
