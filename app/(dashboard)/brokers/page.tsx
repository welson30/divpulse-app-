import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BrokersBoard, type BrokerConnectionRow } from "@/components/dashboard/brokers-board";

export const metadata: Metadata = {
  title: "Broker connections — PaidPrime",
};

export default async function BrokersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: connections }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
    supabase
      .from("broker_connections")
      .select("id, institution_name, status, last_synced_at, needs_reauth, unmatched_positions")
      .eq("user_id", user!.id)
      .neq("status", "disconnected")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <BrokersBoard
      isProPlus={profile?.plan === "pro_plus"}
      connections={(connections ?? []) as BrokerConnectionRow[]}
    />
  );
}
