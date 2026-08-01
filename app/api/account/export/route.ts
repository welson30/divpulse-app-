import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Self-serve personal-data export ("Download my data" in Settings), in
 * the spirit of GDPR Art. 20 data portability — a single structured JSON
 * file covering every table this account owns.
 *
 * Deliberately excludes anything that's a credential or an internal
 * platform reference rather than the user's own data: broker_connections'
 * plaid_access_token/plaid_item_id, push_subscriptions' fcm_token,
 * subscriptions' stripe_customer_id/stripe_subscription_id, and
 * telegram_links' chat_id/link_code. Those are secrets or opaque IDs the
 * account doesn't manage directly — exporting them would hand out
 * credentials, not data the user would recognize as "theirs."
 *
 * dividend_events is deliberately not included — it's shared market
 * reference data (one row per ticker/pay-date, not scoped to any user),
 * not personal data.
 *
 * Runs under the normal cookie-authenticated client, not the service-role
 * one, so every query is still RLS-scoped to auth.uid() as a second line
 * of defense on top of the explicit .eq("user_id", user.id) filters below.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const [
    { data: profile },
    { data: subscription },
    { data: holdings },
    { data: watchlist },
    { data: dividendPayments },
    { data: goals },
    { data: brokerConnections },
    { data: pushDevices },
    { data: telegramLink },
    { data: advisorQueries },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, display_name, plan, calendar_privacy_mode, default_broker_name, created_at")
      .eq("id", user.id)
      .single(),
    supabase.from("subscriptions").select("plan, status, current_period_end").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("holdings")
      .select("ticker, company_name, shares, broker_name, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("watchlist_items")
      .select("ticker, company_name, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: true }),
    supabase
      .from("dividend_payments")
      .select("amount, pay_date, notified_at, notified_channels, holdings(ticker, company_name)")
      .eq("user_id", user.id)
      .order("pay_date", { ascending: true }),
    supabase
      .from("goals")
      .select("goal_type, target_amount, monthly_contribution, monthly_expenses, months_target, current_amount, created_at")
      .eq("user_id", user.id),
    supabase
      .from("broker_connections")
      .select("institution_name, status, last_synced_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("push_subscriptions")
      .select("user_agent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("telegram_links").select("linked_at, chat_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("ai_advisor_queries")
      .select("prompt, response, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    note:
      "This file contains the personal data stored in your PaidPrime account. It excludes internal security credentials " +
      "(broker access tokens, push notification tokens, payment processor IDs), which are never included in data exports.",
    account: profile
      ? {
          email: profile.email,
          displayName: profile.display_name,
          plan: profile.plan,
          calendarPrivacyMode: profile.calendar_privacy_mode,
          defaultBroker: profile.default_broker_name,
          memberSince: profile.created_at,
        }
      : null,
    subscription: subscription
      ? { plan: subscription.plan, status: subscription.status, currentPeriodEnd: subscription.current_period_end }
      : null,
    holdings: (holdings ?? []).map((h) => ({
      ticker: h.ticker,
      companyName: h.company_name,
      shares: h.shares,
      brokerName: h.broker_name,
      source: h.source,
      addedAt: h.created_at,
    })),
    watchlist: (watchlist ?? []).map((w) => ({ ticker: w.ticker, companyName: w.company_name, addedAt: w.added_at })),
    dividendPayments: (dividendPayments ?? []).map((p) => {
      const holding = Array.isArray(p.holdings) ? p.holdings[0] : p.holdings;
      return {
        ticker: holding?.ticker ?? null,
        companyName: holding?.company_name ?? null,
        amount: p.amount,
        payDate: p.pay_date,
        notifiedAt: p.notified_at,
        notifiedChannels: p.notified_channels,
      };
    }),
    goals: (goals ?? []).map((g) => ({
      goalType: g.goal_type,
      targetAmount: g.target_amount,
      monthlyContribution: g.monthly_contribution,
      monthlyExpenses: g.monthly_expenses,
      monthsTarget: g.months_target,
      currentAmount: g.current_amount,
      createdAt: g.created_at,
    })),
    brokerConnections: (brokerConnections ?? []).map((c) => ({
      institutionName: c.institution_name,
      status: c.status,
      lastSyncedAt: c.last_synced_at,
      connectedAt: c.created_at,
    })),
    pushDevices: (pushDevices ?? []).map((d) => ({ device: d.user_agent, registeredAt: d.created_at })),
    telegram: telegramLink ? { linked: telegramLink.chat_id != null, linkedAt: telegramLink.linked_at } : null,
    advisorQueries: (advisorQueries ?? []).map((q) => ({ prompt: q.prompt, response: q.response, askedAt: q.created_at })),
  };

  const filename = `paidprime-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
