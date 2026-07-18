import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Check your email — PaidPrime",
};

export default function CheckEmailPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-sp-3 px-sp-3 py-sp-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
      <img src="/logo.svg" alt="" className="h-12 w-12 rounded-card" width={48} height={48} />
      <h1 className="text-h1">Check your email</h1>
      <p className="max-w-md text-body text-text-secondary">
        We&rsquo;ve sent a confirmation link to your inbox. Click it to activate your account, then sign in.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </main>
  );
}
