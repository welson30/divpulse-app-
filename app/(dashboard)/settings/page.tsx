import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { PushDevicesList, type PushDevice } from "@/components/dashboard/push-devices-list";
import { TelegramConnectCard } from "@/components/dashboard/telegram-connect-card";
import { BillingCard } from "@/components/dashboard/billing-card";
import { PlaidConnectCard } from "@/components/dashboard/plaid-connect-card";

export const metadata: Metadata = {
  title: "Settings — PaidPrime",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface p-sp-4">
      <div className="mb-sp-3">
        <h2 className="text-h2 font-display font-medium text-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-xs text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: devices }, { data: telegramLink }, { data: brokerConnections }] = await Promise.all([
    supabase.from("profiles").select("currency, locale, plan").eq("id", user!.id).single(),
    supabase
      .from("push_subscriptions")
      .select("id, user_agent, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("telegram_links").select("chat_id").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("broker_connections")
      .select("id, institution_name, status, last_synced_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";
  // Telegram is a Pro/Pro+ feature (ARCHITECTURE.md §7) — matching gate
  // lives in app/api/jobs/detect-dividends/route.ts, which independently
  // re-checks profiles.plan server-side before sending (never trust a
  // client-visible flag alone for anything that gates a paid feature).
  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";
  const isProPlus = profile?.plan === "pro_plus";

  return (
    <div className="flex max-w-2xl flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Account</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Settings</h1>
      </div>

      <SettingsSection title="Profile">
        <ProfileSettingsForm email={user!.email ?? ""} currency={profile?.currency ?? "USD"} locale={profile?.locale ?? "en"} />
      </SettingsSection>

      <SettingsSection title="Plan">
        <BillingCard plan={(profile?.plan ?? "free") as "free" | "pro" | "pro_plus"} planLabel={planLabel} />
      </SettingsSection>

      <SettingsSection title="Broker auto-sync" description="Connect a US broker via Plaid to sync holdings automatically.">
        <PlaidConnectCard isProPlus={isProPlus} connections={brokerConnections ?? []} />
      </SettingsSection>

      <SettingsSection title="Telegram" description="Get a Telegram message the moment a dividend is detected.">
        <TelegramConnectCard isPro={isPro} isConnected={!!telegramLink?.chat_id} />
      </SettingsSection>

      <SettingsSection title="Notification devices" description="Devices registered to receive push alerts when a dividend is detected.">
        <PushDevicesList devices={(devices ?? []) as PushDevice[]} />
      </SettingsSection>
    </div>
  );
}
