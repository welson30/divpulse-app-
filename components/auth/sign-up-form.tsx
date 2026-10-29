"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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

function passwordStrengthScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, Math.max(1, score));
}

const STRENGTH_COLORS = ["#22262c", "#e07a5f", "#e0a45c", "#4c82f7", "#3fbf87"];

const fieldClass =
  "box-border h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] pr-4 pl-11 text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] transition-colors focus:border-[#4c82f7]/60";

export function SignUpForm({ oauthError }: SignUpFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signUpWithPassword,
    null,
  );
  const [password, setPassword] = useState("");
  const strengthScore = useMemo(() => passwordStrengthScore(password), [password]);
  const strengthLabels = [t("passwordEnter"), t("passwordWeak"), t("passwordFair"), t("passwordGood"), t("passwordStrong")];
  const strengthColor = STRENGTH_COLORS[strengthScore] ?? "#22262c";
  const strengthLabel = strengthLabels[strengthScore] ?? t("passwordEnter");

  return (
    <div className="flex w-full max-w-[430px] flex-col">
      <h1 className="pp-display m-0 text-[clamp(28px,5vw,32px)] font-semibold leading-[1.05] tracking-[-1.22px] text-[#f2f4f7]">
        {t("createYourAccount")}
      </h1>
      <p className="m-0 mt-[11px] text-[15.5px] leading-[25.19px] text-[#99a1ac]">
        {t("signUpTagline")}
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
          {t("orContinueWithEmail")}
        </span>
        <span aria-hidden className="h-px flex-1 bg-[#22262c]" />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-6">
        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">{t("fullName")}</span>
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
              className={fieldClass}
            />
          </span>
        </label>

        <label className="flex flex-col gap-2.5">
          <span className="text-[14px] leading-[23px] font-medium text-[#f2f4f7]">{t("password")}</span>
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
                    backgroundColor: index < strengthScore ? strengthColor : "#22262c",
                  }}
                />
              ))}
            </div>
            <p className="m-0 text-[11px] leading-[18px] font-normal tracking-[1.1px] text-[#6c737f] uppercase">
              {strengthLabel}
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
            {t("agreeTerms")}{" "}
            <Link href="#" className="text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]">
              {t("termsOfService")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="#" className="text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]">
              {t("privacyPolicy")}
            </Link>
            .
          </span>
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
          {pending ? t("pleaseWait") : t("createAccountButton")}
        </PrimaryCta>
      </form>

      <p className="m-0 mt-[25px] text-center text-[14.5px] leading-[24px] text-[#99a1ac]">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-[#f2f4f7] underline decoration-[#2e343b] underline-offset-2 hover:decoration-[#4c82f7]"
        >
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
