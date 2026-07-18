import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpWithPassword } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign up — DivPulse",
  description: "Create your DivPulse account. Free for up to 5 tracked assets.",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-sp-3 py-sp-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
      <img src="/logo.svg" alt="" className="mb-sp-3 h-12 w-12 rounded-card" width={48} height={48} />

      <Card className="w-full max-w-[400px] bg-surface p-sp-2">
        <CardHeader>
          <CardTitle className="text-h2 font-display">Create your account</CardTitle>
          <CardDescription>Free for up to 5 tracked assets. No card required.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={signUpWithPassword} submitLabel="Create account" />
        </CardContent>
      </Card>

      <p className="mt-sp-3 text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-green-500 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
