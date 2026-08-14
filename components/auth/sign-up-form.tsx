"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { PrimaryCta } from "@/components/marketing/primary-cta";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { AppleSignInButton } from "@/components/auth/apple-signin-button";
import {
  signInWithGoogle,
  signUpWithPassword,
  type AuthActionState,
} from "@/app/(auth)/actions";

type SignUpFormProps = {
  oauthError?: boolean;
};

type Strength = {
  score: number;
  label: string;
  color: string;
};

function passwordStrength(value: string): Strength {
  if (!value) {
    return { score: 0, label: "Enter a password", color: "#22262c" };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  score = Math.min(4, Math.max(1, score));

  if (score <= 1) return { score: 1, label: "Weak", color: "#e07a5f" };
  if (score === 2) return { score: 2, label: "Fair", color: "#e0a45c" };
  if (score === 3) return { score: 3, label: "Good", color: "#4c82f7" };
  return { score: 4, label: "Strong", color: "#3fbf87" };
}

const fieldClass =
  "box-border h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] pr-4 pl-11 text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] transition-colors focus:border-[#4c82f7]/60";

export function SignUpForm({ oauthError }: SignUpFormProps) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signUpWithPassword,
    null,
  );
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);

  return (
    <div className="flex w-full max-w-[430px] flex-col">
      <h1 className="pp-display m-0 text-[clamp(28px,5vw,32px)] font-semibold leading-[1.05] tracking-[-1.22px] text-[#f2f4f7]">
        Create your account
      </h1>
      <p className="m-0 mt-[11px] text-[15.5px] leading-[25.19px] text-[#99a1ac]">
        Two minutes, then never miss a payment again.
      </p>

      <div className="mt-[21px] grid grid-cols-2 gap-3">
        <form action={signInWithGoogle} className="w-full">
          <input type="hidden" name="oauthFailPath" value="/signup" />
          <GoogleSignInButton />
        </form>
        <AppleSignInButton />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span aria-hidden className="h-px flex-1 bg-[#22262c]" />
        <span className="shrink-0 text-[11px] leading-[18px] tracking-[1.76px] text-[#6c737f] uppercase">
          Or continue with email
        </span>
        <span aria-hidden className="h-px flex-1 bg-[#22262c]" />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-6">
        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">Full name</span>
          <span className="relative block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/signin/icon-user.svg"
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
            />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Jordan Blake"
              className={fieldClass}
            />
          </span>
        </label>

        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">Email</span>
          <span className="relative block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/signin/icon-email.svg"
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@domain.com"
              className={fieldClass}
            />
          </span>
        </label>

        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">Password</span>
          <span className="relative block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/signin/icon-lock.svg"
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </span>
          <div className="flex flex-col gap-[5px]">
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className="h-1 min-w-px flex-1 rounded-full bg-[#22262c] transition-colors duration-200"
                  style={{
                    backgroundColor: index < strength.score ? strength.color : "#22262c",
                  }}
                />
              ))}
            </div>
            <p className="m-0 text-[11px] leading-[18px] font-normal tracking-[1.1px] text-[#6c737f] uppercase">
              {strength.label}
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[21px] text-[#99a1ac]">
          <span className="relative mt-0.5 inline-flex size-4 shrink-0">
            <input
              type="checkbox"
              name="terms"
              required
              className="peer size-4 cursor-pointer appearance-none rounded-[2.5px] border border-[#767676] bg-white checked:border-[#4c82f7] checked:bg-[#4c82f7]"
            />
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute inset-0 hidden size-4 peer-checked:block"
              aria-hidden
            >
              <path
                d="M4 8.2 6.6 11 12 5"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
          <span>
            I agree to the{" "}
            <Link href="#" className="text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {state?.error || oauthError ? (
          <p role="alert" className="m-0 text-[13px] leading-[21px] text-[#f87171]">
            {state?.error ?? "Google sign-in failed. Try email, or try Google again."}
          </p>
        ) : null}

        <PrimaryCta
          type="submit"
          disabled={pending}
          className="h-[52px] w-full rounded-[10px] text-[16px] font-medium leading-[26px] shadow-[0px_16px_40px_-16px_#4c82f7]"
        >
          {pending ? "Please wait…" : "Create account"}
        </PrimaryCta>
      </form>

      <p className="m-0 mt-[25px] text-center text-[14.5px] leading-[24px] text-[#99a1ac]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
