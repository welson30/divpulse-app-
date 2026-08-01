"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CollectionSectorFilterProps = {
  categories: string[];
  current: string;
};

/** Filters the Collections page's sections by category via `?sector=`. Two separate triggers (not one responsive element) — a labeled Radix dropdown on desktop, an icon button wrapping an invisible native select on mobile (Radix's trigger always renders its own chevron, which doesn't fit a bare icon-square button) — same split ownership as CollectionTable's mobile/desktop trees and the icon-button pattern already proven in CalendarMonthJump. */
export function CollectionSectorFilter({ categories, current }: CollectionSectorFilterProps) {
  const router = useRouter();

  function go(value: string) {
    router.push(value === "all" ? "/collections" : `/collections?sector=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <Select value={current} onValueChange={go}>
        <SelectTrigger aria-label="Filter by sector" className="hidden w-auto shrink-0 lg:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sectors</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-interactive bg-surface hover:bg-muted lg:hidden">
        <SlidersHorizontal className="size-4" aria-hidden />
        <span className="sr-only">Filter by sector</span>
        <select
          aria-label="Filter by sector"
          value={current}
          onChange={(e) => go(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          <option value="all">All Sectors</option>
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
