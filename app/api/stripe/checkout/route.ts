import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Creates a Stripe Checkout Session for upgrading to Pro or Pro+
 * (ARCHITECTURE.md §9.5). Called from the client with { plan: "pro" |
 * "pro_plus" }; redirects the browser to Stripe's hosted checkout page.
 *
 * Reuses an existing Stripe customer if this user already has one on
 * `subscriptions` (e.g. from a prior canceled attempt), otherwise creates
 * one — Checkout Sessions need a customer to attach the resulting
 * subscription to something we can look up again in the webhook.
 */
export async function POST(request: NextRequest) {
  const { plan } = (await request.json()) as { plan?: "pro" | "pro_plus" };

  if (plan !== "pro" && plan !== "pro_plus") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Billing isn't fully configured yet — check back soon." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const stripe = getStripe();

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existingSubscription?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/settings?checkout=success`,
    cancel_url: `${SITE_URL}/settings?checkout=canceled`,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
