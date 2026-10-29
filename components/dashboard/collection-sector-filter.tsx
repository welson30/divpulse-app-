"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CollectionSectorFilterProps = {
  categories: string[];
  current: string;
};

/** Filters the Collections page's sections by category via `?sector=`. Two separate triggers (not one responsive element) — a labeled Radix dropdown on desktop, an icon button wrapping an invisible native select on mobile (Radix's trigger always renders its own chevron, which doesn't fit a bare icon-square button) — same split ownership as CollectionTable's mobile/desktop trees and the icon-button pattern already proven in CalendarMonthJump. */
export function CollectionSectorFilter({ categories, current }: CollectionSectorFilterProps) {
  const t = useTranslations("dashboard.collections");
  const router = useRouter();

  function go(value: string) {
    router.push(value === "all" ? "/collections" : `/collections?sector=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <Select value={current} onValueChange={go}>
        <SelectTrigger aria-label={t("filterBySector")} className="hidden w-auto shrink-0 lg:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allSectors")}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-interactive bg-surface hover:bg-muted lg:hidden">
        <SlidersHorizontal className="size-4" aria-hidden />
        <span className="sr-only">{t("filterBySector")}</span>
        <select
          aria-label={t("filterBySector")}
          value={current}
          onChange={(e) => go(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          <option value="all">{t("allSectors")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
