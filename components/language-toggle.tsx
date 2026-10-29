"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

const COOKIE_NAME = "PAIDPRIME_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

async function saveLanguageToSupabase(locale: string) {
  try {
    await fetch("/api/account/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: locale }),
    });
  } catch {
    // best-effort — cookie is already set
  }
}

function setLocaleCookie(locale: string) {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

interface LanguageToggleProps {
  /** "minimal" shows only the label chip (for navbars). "full" shows a row with label. */
  variant?: "minimal" | "full";
  /** Whether the user is authenticated (enables Supabase sync). */
  authenticated?: boolean;
}

export function LanguageToggle({ variant = "minimal", authenticated = false }: LanguageToggleProps) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const other = locale === "en" ? "pt" : "en";
  const label = other === "pt" ? "PT" : "EN";
  const ariaLabel = other === "pt" ? "Switch to Português" : "Switch to English";

  function handleSwitch() {
    startTransition(() => {
      setLocaleCookie(other);
      if (authenticated) {
        saveLanguageToSupabase(other);
      }
      // Reload so next-intl re-reads the cookie server-side
      window.location.reload();
    });
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleSwitch}
        disabled={isPending}
        aria-label={ariaLabel}
        className="flex items-center gap-2.5 rounded-[10px] border border-[#22262c] bg-[#0f1117] px-3 py-2 text-[13px] font-medium text-[#99a1ac] transition-all hover:border-[#4c82f7]/40 hover:bg-[rgba(76,130,247,0.08)] hover:text-[#f2f4f7] disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{label}</span>
      </button>
    );
  }

  // minimal — just a compact chip for tight navbars
  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={ariaLabel}
      className="flex h-8 items-center justify-center rounded-[8px] border border-[#22262c] bg-[#0f1117] px-2.5 text-[12px] font-semibold text-[#6c737f] transition-all hover:border-[#4c82f7]/40 hover:text-[#f2f4f7] disabled:opacity-50"
    >
      {isPending ? "…" : label}
    </button>
  );
}
