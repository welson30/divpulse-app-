"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { PrimaryCta } from "@/components/marketing/primary-cta";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { AppleSignInButton } from "@/components/auth/apple-signin-button";
import {
  signInWithGoogle,
  signInWithPassword,
  type AuthActionState,
} from "@/app/(auth)/actions";

type SignInFormProps = {
  redirectTo?: string;
  oauthError?: boolean;
};

export function SignInForm({ redirectTo, oauthError }: SignInFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signInWithPassword,
    null,
  );

  return (
    <div className="flex w-full max-w-[430px] flex-col">
      <h1 className="pp-display m-0 text-[clamp(28px,5vw,32px)] font-semibold leading-[1.05] tracking-[-1.22px] text-[#f2f4f7]">
        {t("welcomeBack")}
      </h1>
      <p className="m-0 mt-[11px] text-[15.5px] leading-[25.19px] text-[#99a1ac]">
        {t("signInTagline")}
      </p>

      <div className="mt-[21px] grid grid-cols-2 gap-3">
        <form action={signInWithGoogle} className="w-full">
          <input type="hidden" name="oauthFailPath" value="/login" />
          <GoogleSignInButton />
        </form>
        <AppleSignInButton />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span aria-hidden className="h-px flex-1 bg-[#22262c]" />
        <span className="shrink-0 text-[11px] leading-[18px] tracking-[1.76px] text-[#6c737f] uppercase">
          {t("orContinueWithEmail")}
        </span>
        <span aria-hidden className="h-px flex-1 bg-[#22262c]" />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-6">
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">{t("email")}</span>
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
              className="box-border h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] pr-4 pl-11 text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] transition-colors focus:border-[#4c82f7]/60"
            />
          </span>
        </label>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">
              {t("password")}
            </label>
            <Link
              href="mailto:paidprime1@gmail.com?subject=Password%20reset"
              className="text-[13px] leading-[21px] font-medium text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]"
            >
              {t("forgotPassword")}
            </Link>
          </div>
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
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="••••••••"
              className="box-border h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] pr-4 pl-11 text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] transition-colors focus:border-[#4c82f7]/60"
            />
          </span>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] leading-[21px] text-[#99a1ac]">
          <span className="relative inline-flex size-4 shrink-0">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="peer size-4 cursor-pointer appearance-none rounded-[2.5px] border border-[#2e343b] bg-[#0b0c0e] checked:border-[#4c82f7] checked:bg-[#4c82f7]"
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
          {t("rememberMe")}
        </label>

        {state?.error || oauthError ? (
          <p role="alert" className="m-0 text-[13px] leading-[21px] text-[#f87171]">
            {state?.error ?? t("googleFailed")}
          </p>
        ) : null}

        <PrimaryCta
          type="submit"
          disabled={pending}
          className="h-[52px] w-full rounded-[10px] text-[16px] font-medium leading-[26px] shadow-[0px_16px_40px_-16px_#4c82f7]"
        >
          {pending ? t("pleaseWait") : t("continueButton")}
        </PrimaryCta>
      </form>

      <p className="m-0 mt-[25px] text-center text-[14.5px] leading-[24px] text-[#99a1ac]">
        {t("newToPaidPrime")}{" "}
        <Link
          href="/signup"
          className="font-medium text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]"
        >
          {t("createAccountButton")}
        </Link>
      </p>
    </div>
  );
}
