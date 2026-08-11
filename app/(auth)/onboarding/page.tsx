import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInAside } from "@/components/auth/sign-in-aside";
import { OnboardingWelcome } from "@/components/auth/onboarding-welcome";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome — PaidPrime",
  description: "Your PaidPrime account is ready. Three quick steps to a live income dashboard.",
};

/**
 * Figma Onboarding Page 1 — 8:200 (1440 × 900).
 * Desktop ≥1024 = side-by-side. Tablet/mobile = form-first.
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.display_name?.trim() ||
    (typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "") ||
    "";
  const firstName = fullName.split(/\s+/)[0] || null;

  return (
    <div className="pp-landing grid min-h-dvh bg-[#0b0c0e] min-[1024px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <SignInAside />

      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-14 min-[1024px]:px-10">
        <a
          href="/"
          className="mb-10 flex h-9 w-[132px] self-start min-[1024px]:hidden"
          aria-label="PaidPrime home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/signin/logo.png"
            alt="PaidPrime"
            width={162}
            height={49}
            className="h-full w-full object-contain object-left"
          />
        </a>

        <OnboardingWelcome firstName={firstName} />
      </main>
    </div>
  );
}
