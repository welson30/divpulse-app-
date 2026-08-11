import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend/client";

// This route runs on every login (OAuth and email-confirmation both
// redirect through here), not just first-time signup — profiles.created_at
// (set once, by the handle_new_user trigger) is the only reliable signal
// for "this account was just created" without adding a new column. A
// 15-second tolerance covers the round-trip between the trigger firing
// and this request landing.
const NEW_ACCOUNT_WINDOW_MS = 15_000;

/** Exchanges the OAuth/email-confirmation code for a session, per Supabase's PKCE flow. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: profile } = await supabase.from("profiles").select("created_at").eq("id", user.id).single();
        const isNewAccount = profile?.created_at && Date.now() - new Date(profile.created_at).getTime() < NEW_ACCOUNT_WINDOW_MS;

        if (isNewAccount) {
          // Best-effort — a welcome email failing to send should never
          // block the user from reaching the app they just signed up for.
          sendWelcomeEmail(user.email).catch(() => {});
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
