import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

/**
 * ONE-TIME ADMIN ENDPOINT — force-syncs a Stripe subscription to Supabase.
 *
 * Use when the webhook failed (wrong secret, wrong URL, etc.) and a user
 * paid but their plan still shows Free.
 *
 * Protected by CRON_SECRET — same secret already used for cron routes.
 * DELETE THIS FILE once the issue is resolved and the webhook is working.
 *
 * Usage:
 *   POST /api/admin/sync-subscription
 *   Authorization: Bearer <CRON_SECRET>
 *   { "email": "user@example.com" }
 */

const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

function toDbStatus(status: Stripe.Subscription.Status): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }
  return "canceled";
}

function planFromPriceId(priceId: string | undefined): "pro" | "pro_plus" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO_PLUS) return "pro_plus";
  return null;
}

export async function POST(request: NextRequest) {
  // Auth check — reuse CRON_SECRET so no new secrets needed
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const stripe = getStripe();
  const supabase = createAdminClient();

  // 1. Find Stripe customer by email
  const customers = await stripe.customers.list({ email, limit: 5 });
  if (customers.data.length === 0) {
    return NextResponse.json({ error: `No Stripe customer found for ${email}` }, { status: 404 });
  }

  const results = [];

  for (const customer of customers.data) {
    // 2. Find Supabase user ID — from customer metadata first, then subscriptions table
    let userId: string | null = customer.metadata?.supabase_user_id ?? null;

    if (!userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customer.id)
        .maybeSingle();
      userId = sub?.user_id ?? null;
    }

    if (!userId) {
      // Fall back: look up by email in auth.users via profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userId = profile?.id ?? null;
    }

    if (!userId) {
      results.push({ customer_id: customer.id, error: "Could not find Supabase user ID" });
      continue;
    }

    // 3. Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find((s) =>
      ACTIVE_STATUSES.includes(s.status)
    );

    if (!activeSubscription) {
      results.push({ customer_id: customer.id, user_id: userId, error: "No active subscription found" });
      continue;
    }

    const priceId = activeSubscription.items.data[0]?.price.id;
    const plan = planFromPriceId(priceId);
    const isActive = ACTIVE_STATUSES.includes(activeSubscription.status);
    const effectivePlan = isActive && plan ? plan : "free";

    // 4. Sync to subscriptions table
    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: activeSubscription.id,
        plan: effectivePlan,
        status: toDbStatus(activeSubscription.status),
        current_period_end: new Date(
          activeSubscription.items.data[0]!.current_period_end * 1000
        ).toISOString(),
      },
      { onConflict: "user_id" }
    );

    // 5. Update profiles.plan
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan: effectivePlan })
      .eq("id", userId);

    results.push({
      customer_id: customer.id,
      user_id: userId,
      subscription_id: activeSubscription.id,
      stripe_status: activeSubscription.status,
      price_id: priceId,
      plan_set: effectivePlan,
      upsert_error: upsertError?.message ?? null,
      profile_error: profileError?.message ?? null,
      success: !upsertError && !profileError,
    });
  }

  return NextResponse.json({ email, results });
}
