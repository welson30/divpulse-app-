import type { Metadata } from "next";
import { SignInAside } from "@/components/auth/sign-in-aside";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up — PaidPrime",
  description: "Create your PaidPrime account. Free for up to 5 tracked assets.",
};

/**
 * Figma Sign Up 8:478 (1440 × 900).
 * Desktop ≥1024 = side-by-side (1.05 / 0.95). Tablet/mobile = form only.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

        <SignUpForm oauthError={error === "oauth_failed"} />
      </main>
    </div>
  );
}
