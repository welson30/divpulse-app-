"use client";

import { useActionState } from "react";
import { PrimaryCta } from "@/components/marketing/primary-cta";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

/**
 * Email capture for the coming-soon gate. Submits through a server action
 * and stays on the page — the visitor is never navigated away, since the
 * only goal while the site is gated is collecting the address.
 */
export function WaitlistForm() {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, null);

  if (state && "success" in state) {
    return (
      <p
        role="status"
        className="m-0 flex items-center gap-2.5 text-[16px] leading-[26px] font-medium text-[#3fbf87]"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-[#3fbf87]" aria-hidden />
        You&rsquo;re on the list — we&rsquo;ll be in touch.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-[440px] flex-col gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@domain.com"
          aria-label="Your email address"
          aria-invalid={state && "error" in state ? true : undefined}
          className="box-border h-[52px] min-w-0 flex-1 rounded-[14px] border border-[#2e343b] bg-[#121417] px-4 text-[16px] text-[#f2f4f7] transition-colors outline-none placeholder:text-[#6c737f] focus:border-[#4c82f7]/60"
        />
        <PrimaryCta
          type="submit"
          disabled={pending}
          className="h-[52px] shrink-0 rounded-[14px] px-6 text-[16px]"
        >
          {pending ? "Saving…" : "Notify me"}
        </PrimaryCta>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="m-0 text-[13px] leading-[21px] text-[#f87171]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
