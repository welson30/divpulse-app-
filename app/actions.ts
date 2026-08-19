"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type WaitlistState = { error: string } | { success: true } | null;

// RFC-ish enough for a signup box: one @, no whitespace, a dot in the
// domain. Deliberately not a maximal regex — the address is confirmed by
// actually mailing it, not by parsing.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Stores an address from the public coming-soon gate (app/page.tsx).
 *
 * Uses the service-role client because waitlist_signups has RLS on with no
 * policies — see supabase/migrations/20260819000000_waitlist_signups.sql.
 * That's what keeps the list unreadable from the browser and stops anyone
 * inserting into it directly with the anon key; every write has to come
 * through here, where it's validated first.
 */
export async function joinWaitlist(_prevState: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Enter your email address." };
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { error: "That doesn't look like a valid email address." };
  }

  const { error } = await createAdminClient()
    .from("waitlist_signups")
    .insert({ email, source: "coming_soon" });

  if (error) {
    // 23505 = unique violation on lower(email): they're already signed up.
    // Reported as success — it's the truthful outcome from the visitor's
    // point of view, and saying "already registered" would turn the form
    // into a way to test which addresses are on the list.
    if (error.code === "23505") {
      return { success: true };
    }
    // The raw Postgres message is never surfaced — it can carry schema
    // detail, and there's nothing the visitor could do with it.
    console.error("[joinWaitlist] insert failed", error);
    return { error: "Couldn't save your email just now. Please try again." };
  }

  return { success: true };
}
