"use client";

import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/language-toggle";

/**
 * Language preference card for the Settings > Profile tab.
 * Client component because LanguageToggle uses useLocale.
 */
export function LanguageSection() {
  const t = useTranslations("dashboard.settings");

  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#22262c] bg-[#0f1117] p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[14px] font-semibold leading-[23.1px] text-[#f2f4f7]">
            {t("language")}
          </h2>
          <p className="text-[13px] leading-[21.45px] text-[#6c737f]">
            {t("languageDescription")}
          </p>
        </div>
        <LanguageToggle variant="full" authenticated />
      </div>
    </section>
  );
}
