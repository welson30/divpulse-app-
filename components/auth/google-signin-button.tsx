"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Must render as a descendant of the <form action={signInWithGoogle}>
 * that uses it — useFormStatus only reports the status of the nearest
 * ancestor form, not a form rendered by this same component.
 */
export function GoogleSignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] border border-[#2e343b] bg-[#16191d] text-[15px] leading-[25px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:border-[#2e343b]"
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/marketing/signin/icon-google.svg" alt="" width={18} height={18} className="size-[18px]" />
      )}
      {pending ? "Redirecting…" : "Google"}
    </button>
  );
}
