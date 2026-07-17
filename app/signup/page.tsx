import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign up — PaidPrime",
  description: "Create your PaidPrime account. Free for up to 5 tracked assets.",
};

// Placeholder until Supabase auth lands (ARCHITECTURE.md §14) — every
// marketing CTA points here so the links are real from day one.
export default function SignUpPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-sp-3 px-sp-3 py-sp-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
      <img src="/logo.svg" alt="PaidPrime" className="h-14 w-14 rounded-card" width={56} height={56} />
      <h1 className="text-h1">Sign-ups open soon</h1>
      <p className="max-w-md text-body text-text-secondary">
        PaidPrime is in private beta. Account creation lands here shortly — the free plan starts with 5 tracked
        assets, no card required.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
