import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { PushDevicesList, type PushDevice } from "@/components/dashboard/push-devices-list";
import { TelegramConnectCard } from "@/components/dashboard/telegram-connect-card";
import { BillingCard } from "@/components/dashboard/billing-card";

export const metadata: Metadata = {
  title: "Settings — PaidPrime",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: devices }, { data: telegramLink }] = await Promise.all([
    supabase.from("profiles").select("display_name, currency, locale, plan").eq("id", user!.id).single(),
    supabase
      .from("push_subscriptions")
      .select("id, user_agent, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("telegram_links").select("chat_id").eq("user_id", user!.id).maybeSingle(),
  ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";
  // TODO(stripe): Telegram is a Pro/Pro+ feature (ARCHITECTURE.md §7) but
  // the plan gate is disabled here so it can be tested pre-billing.
  // Restore to `profile?.plan === "pro" || profile?.plan === "pro_plus"`
  // once Stripe subscriptions are live. Must be re-enabled alongside the
  // matching gate in app/api/jobs/detect-dividends/route.ts.
  const isPro = true;

  return (
    <div className="flex max-w-xl flex-col gap-sp-5">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Account</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Settings</h1>
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Profile</h2>
        <ProfileSettingsForm
          email={user!.email ?? ""}
          displayName={profile?.display_name ?? null}
          currency={profile?.currency ?? "USD"}
          locale={profile?.locale ?? "en"}
        />
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Plan</h2>
        <BillingCard plan={(profile?.plan ?? "free") as "free" | "pro" | "pro_plus"} planLabel={planLabel} />
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Telegram</h2>
        <TelegramConnectCard isPro={isPro} isConnected={!!telegramLink?.chat_id} />
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Notification devices</h2>
        <p className="-mt-1 text-xs text-text-secondary">
          Devices registered to receive push alerts when a dividend is detected.
        </p>
        <PushDevicesList devices={(devices ?? []) as PushDevice[]} />
      </div>
    </div>
  );
}
