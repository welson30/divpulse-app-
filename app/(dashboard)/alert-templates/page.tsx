import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  AlertTemplatesBoard,
  type TemplatePreview,
} from "@/components/dashboard/alert-templates-board";
import type { NotificationStyle } from "@/lib/notifications/templates";

export const metadata: Metadata = {
  title: "Notification templates — PaidPrime",
};

const ILLUSTRATIVE: TemplatePreview = {
  ticker: "ABC",
  amount: 12.4,
  broker: null,
  fromLivePayment: false,
};

function asStyle(value: string | null | undefined): NotificationStyle {
  if (value === "descriptive" || value === "premium") return value;
  return "compact";
}

export default async function AlertTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: pushCount }, { data: telegramLink }, { data: latest }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, notification_style, default_broker_name")
      .eq("id", user!.id)
      .single(),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("telegram_links").select("chat_id").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("dividend_payments")
      .select("amount, holding_id")
      .eq("user_id", user!.id)
      .order("pay_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let preview = ILLUSTRATIVE;
  if (latest) {
    const { data: holding } = await supabase
      .from("holdings")
      .select("ticker, broker_name")
      .eq("id", latest.holding_id)
      .maybeSingle();
    if (holding?.ticker) {
      preview = {
        ticker: holding.ticker,
        amount: Number(latest.amount),
        broker: holding.broker_name ?? profile?.default_broker_name ?? null,
        fromLivePayment: true,
      };
    }
  } else if (profile?.default_broker_name) {
    preview = { ...ILLUSTRATIVE, broker: profile.default_broker_name };
  }

  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";

  return (
    <div className="flex flex-col gap-6">
      <AlertTemplatesBoard
        notificationStyle={asStyle(profile?.notification_style)}
        preview={preview}
        pushEnabled={(pushCount ?? 0) > 0}
        telegramConnected={!!telegramLink?.chat_id}
        isPro={isPro}
      />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
