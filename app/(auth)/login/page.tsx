import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signInWithPassword } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign in — DivPulse",
  description: "Sign in to your DivPulse dashboard.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-sp-3 py-sp-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
      <img src="/logo.svg" alt="" className="mb-sp-3 h-12 w-12 rounded-card" width={48} height={48} />

      <Card className="w-full max-w-[400px] bg-surface p-sp-2">
        <CardHeader>
          <CardTitle className="text-h2 font-display">Welcome back</CardTitle>
          <CardDescription>Sign in to see what's landed since you last checked.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={signInWithPassword} submitLabel="Sign in" redirectTo={redirectTo} />
        </CardContent>
      </Card>

      <p className="mt-sp-3 text-sm text-text-secondary">
        Don&rsquo;t have an account?{" "}
        <Link href="/signup" className="text-green-500 hover:underline">
          Sign up free
        </Link>
      </p>
    </main>
  );
}
