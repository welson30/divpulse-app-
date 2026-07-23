import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Single Stripe SDK instance, server-only — mirrors lib/firebase/admin.ts's getFirebaseAdminApp() pattern. */
export function getStripe(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  pro_plus: process.env.STRIPE_PRICE_ID_PRO_PLUS,
} as const;
