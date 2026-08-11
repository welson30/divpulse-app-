import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { CalendarPrivacyForm } from "@/components/dashboard/calendar-privacy-form";
import { BillingCard } from "@/components/dashboard/billing-card";
import { SettingsBillingPanel } from "@/components/dashboard/settings-billing-panel";
import { SettingsTabs, SETTINGS_TABS, type SettingsTab } from "@/components/dashboard/settings-tabs";

export const metadata: Metadata = {
  title: "Settings — PaidPrime",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; checkout?: string }>;
}) {
  const { tab: tabParam, checkout } = await searchParams;

  if (tabParam === "integrations") redirect("/brokers");
  if (tabParam === "notifications") redirect("/alert-templates");

  const tab: SettingsTab = SETTINGS_TABS.some((t) => t.value === tabParam)
    ? (tabParam as SettingsTab)
    : checkout
      ? "subscription"
      : "profile";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, calendar_privacy_mode, display_name, default_broker_name, currency")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("stripe_customer_id, current_period_end, status")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  const plan = (profile?.plan ?? "free") as "free" | "pro" | "pro_plus";
  const planLabel = PLAN_LABELS[plan] ?? "Free";

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Account</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Settings
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          Manage your profile, security, plan and billing details.
        </p>
      </header>

      <div className="flex flex-col items-start gap-6 min-[900px]:flex-row">
        <SettingsTabs current={tab} />

        <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
          {tab === "profile" ? (
            <>
              <ProfileSettingsForm
                email={user!.email ?? ""}
                displayName={profile?.display_name ?? ""}
                defaultBroker={profile?.default_broker_name ?? ""}
                currency={profile?.currency ?? "USD"}
              />
              <CalendarPrivacyForm calendarPrivacyMode={profile?.calendar_privacy_mode ?? "full"} />
            </>
          ) : null}

          {tab === "security" ? <ChangePasswordForm /> : null}

          {tab === "subscription" ? (
            <BillingCard plan={plan} planLabel={planLabel} periodEnd={subscription?.current_period_end ?? null} />
          ) : null}

          {tab === "billing" ? (
            <SettingsBillingPanel hasStripeCustomer={Boolean(subscription?.stripe_customer_id)} />
          ) : null}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
