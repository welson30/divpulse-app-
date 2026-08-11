import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NotificationsInbox, type InboxChannel, type InboxItem } from "@/components/dashboard/notifications-inbox";

export const metadata: Metadata = {
  title: "Notifications — PaidPrime",
};

const PAGE_LIMIT = 200;
const CHANNELS = new Set<InboxChannel>(["push", "telegram", "email"]);

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: holdings }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("notifications_last_seen_at").eq("id", user!.id).single(),
    supabase.from("holdings").select("id, ticker, broker_name").eq("user_id", user!.id),
    supabase
      .from("dividend_payments")
      .select("id, amount, notified_at, notified_channels, holding_id")
      .eq("user_id", user!.id)
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(PAGE_LIMIT),
  ]);

  const holdingById = new Map((holdings ?? []).map((h) => [h.id, h]));
  const items: InboxItem[] = (payments ?? [])
    .map((p) => {
      const holding = holdingById.get(p.holding_id);
      if (!holding) return null;
      const channels = ((p.notified_channels as string[] | null) ?? [])
        .map((ch) => ch.toLowerCase())
        .filter((ch): ch is InboxChannel => CHANNELS.has(ch as InboxChannel));
      return {
        id: p.id,
        ticker: holding.ticker,
        amount: Number(p.amount),
        broker: holding.broker_name,
        notifiedAt: p.notified_at as string,
        channels,
      };
    })
    .filter((row): row is InboxItem => row !== null);

  return (
    <div className="flex flex-col gap-6">
      <NotificationsInbox
        items={items}
        lastSeenAt={profile?.notifications_last_seen_at ?? new Date(0).toISOString()}
      />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
