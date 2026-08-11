import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { SettingsQuickActions } from "@/components/dashboard/settings-quick-actions";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { PushDevicesList, type PushDevice } from "@/components/dashboard/push-devices-list";
import { EnableNotificationsButton } from "@/components/notifications/enable-notifications-button";
import { CalendarPrivacyForm } from "@/components/dashboard/calendar-privacy-form";
import { TelegramConnectCard } from "@/components/dashboard/telegram-connect-card";
import { BillingCard } from "@/components/dashboard/billing-card";
import { GreetingBackdrop } from "@/components/dashboard/greeting-backdrop";
import { SettingsTabs, SETTINGS_TABS, type SettingsTab } from "@/components/dashboard/settings-tabs";

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

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: SettingsTab = SETTINGS_TABS.some((t) => t.value === tabParam) ? (tabParam as SettingsTab) : "profile";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: devices }, { data: telegramLink }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, calendar_privacy_mode, display_name, default_broker_name")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("push_subscriptions")
      .select("id, user_agent, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("telegram_links").select("chat_id").eq("user_id", user!.id).maybeSingle(),
  ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";
  // Telegram is a Pro/Pro+ feature (ARCHITECTURE.md §7) — matching gate
  // lives in app/api/jobs/detect-dividends/route.ts, which independently
  // re-checks profiles.plan server-side before sending (never trust a
  // client-visible flag alone for anything that gates a paid feature).
  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";

  return (
    <div className="min-w-0 flex flex-col gap-sp-4">
      <div className="relative">
        <GreetingBackdrop />
        <div className="relative z-10">
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Account</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your profile, preferences, and subscription.</p>
        </div>
      </div>

      <SettingsTabs current={tab} />

      {tab === "profile" ? (
        <div className="grid grid-cols-1 items-start gap-sp-3 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 flex flex-col gap-sp-3">
            <SettingsSection title="Profile information" description="Update your personal details and preferences.">
              <ProfileSettingsForm
                email={user!.email ?? ""}
                emailVerified={user!.email_confirmed_at != null}
                displayName={profile?.display_name ?? ""}
                defaultBroker={profile?.default_broker_name ?? ""}
              />
            </SettingsSection>

            <SettingsSection title="Plan">
              <BillingCard plan={(profile?.plan ?? "free") as "free" | "pro" | "pro_plus"} planLabel={planLabel} />
            </SettingsSection>
          </div>

          <SettingsSection title="Quick actions">
            <SettingsQuickActions />
          </SettingsSection>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="flex max-w-2xl flex-col gap-sp-3">
          <SettingsSection title="Push notifications" description="Get a push alert on this device the moment a dividend is detected.">
            <div className="mb-sp-3">
              <EnableNotificationsButton />
            </div>
            <PushDevicesList devices={(devices ?? []) as PushDevice[]} />
          </SettingsSection>

          <SettingsSection
            title="Notification style"
            description="Choose how much detail your dividend alerts show, on push, Telegram, and in the bell menu."
          >
            <Link
              href="/alert-templates"
              className="inline-flex h-9 items-center rounded-[10px] border border-[#2e343b] bg-[#16191d] px-4 text-[13px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]"
            >
              Open notification templates
            </Link>
          </SettingsSection>

          <SettingsSection
            title="Calendar privacy"
            description="Control what your dividend calendar shows — useful for recording demos without revealing your holdings."
          >
            <CalendarPrivacyForm calendarPrivacyMode={profile?.calendar_privacy_mode ?? "full"} />
          </SettingsSection>
        </div>
      ) : null}

      {tab === "security" ? (
        <div className="flex max-w-2xl flex-col gap-sp-3">
          <SettingsSection title="Change password" description="Choose a new password for your account.">
            <ChangePasswordForm />
          </SettingsSection>
        </div>
      ) : null}

      {tab === "integrations" ? (
        <div className="flex max-w-2xl flex-col gap-sp-3">
          <SettingsSection
            title="Broker auto-sync"
            description="Connect a US broker via Plaid to sync holdings automatically. Pro+ only."
          >
            <Link href="/brokers" className="text-sm text-[#4c82f7] hover:underline">
              Open broker connections
            </Link>
          </SettingsSection>

          <SettingsSection title="Telegram" description="Get a Telegram message the moment a dividend is detected.">
            <TelegramConnectCard isPro={isPro} isConnected={!!telegramLink?.chat_id} />
          </SettingsSection>
        </div>
      ) : null}
    </div>
  );
}
