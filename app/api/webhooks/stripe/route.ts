import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";

/**
 * Stripe webhook — the single source of truth sync point for billing
 * state (ARCHITECTURE.md §9.5 / §10: "subscriptions.plan ... kept in sync
 * by the Stripe webhook"). Writes both `subscriptions` (full Stripe
 * mirror: customer/subscription IDs, status, period end — needed for the
 * Customer Portal and for this webhook's own idempotent upserts) AND
 * `profiles.plan` (the flag every existing plan-gate already reads —
 * holdings cap, Telegram gate, dashboard nav — so billing didn't require
 * retrofitting five call sites to read a second table).
 *
 * Verifies Stripe's signature header before trusting any payload — this
 * is the actual authentication boundary for an endpoint that changes
 * what a user is billed for and what they can access.
 *
 * URL is /api/webhooks/stripe (not /api/stripe/webhook) to match the
 * webhook URL the client already had registered in Stripe.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Signature verification failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId || !session.subscription || !session.customer) break;

      const subscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === "string" ? session.subscription : session.subscription.id,
      );
      await syncSubscription(supabase, userId, subscription);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id ?? (await lookupUserIdByCustomer(supabase, subscription.customer));
      if (!userId) break;

      await syncSubscription(supabase, userId, subscription);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function lookupUserIdByCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : customer.id;
  const { data } = await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.user_id ?? null;
}

function planFromPriceId(priceId: string | undefined): "pro" | "pro_plus" | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_IDS.pro) return "pro";
  if (priceId === STRIPE_PRICE_IDS.pro_plus) return "pro_plus";
  return null;
}

// Stripe's subscription statuses that mean "the user has one of our plans" —
// anything else (canceled, incomplete_expired, unpaid) drops the user to
// Free. "past_due" still counts as active here — losing plan access on
// the first missed payment before Stripe's own retry/dunning flow has
// run its course is harsher than intended for this app's use case.
const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

// subscriptions.status (supabase/migrations/20260717000000) only covers
// a subset of Stripe's actual Subscription.Status values — anything not
// listed here (incomplete_expired, paused, unpaid) collapses to
// "canceled", the closest meaning in our narrower enum, so an unmapped
// status can never fail the upsert with a Postgres enum violation.
function toDbStatus(status: Stripe.Subscription.Status): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }
  return "canceled";
}

async function syncSubscription(supabase: ReturnType<typeof createAdminClient>, userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId);
  const isActive = ACTIVE_STATUSES.includes(subscription.status);
  const effectivePlan = isActive && plan ? plan : "free";

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      plan: effectivePlan,
      status: toDbStatus(subscription.status),
      current_period_end: new Date(subscription.items.data[0]!.current_period_end * 1000).toISOString(),
    },
    { onConflict: "user_id" },
  );

  await supabase.from("profiles").update({ plan: effectivePlan }).eq("id", userId);
}
