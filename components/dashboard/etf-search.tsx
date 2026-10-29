"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { TickerSearchCombobox } from "@/components/dashboard/ticker-search-combobox";
import type { TickerSearchResult } from "@/lib/tickers/search";

/**
 * Search bar for the ETF Explorer page.
 * When the user selects a result, navigates to the existing ticker detail page.
 */
export function EtfSearch() {
  const t = useTranslations("dashboard.etfExplorer");
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSelect(result: TickerSearchResult) {
    router.push(`/tickers/${result.ticker}`);
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) router.push(`/tickers/${ticker}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="pointer-events-none absolute inset-y-0 left-sp-3 flex items-center">
        <Search className="h-4 w-4 text-text-secondary" />
      </div>
      <TickerSearchCombobox
        id="etf-search"
        name="etf-search"
        value={value}
        onValueChange={setValue}
        onSelect={handleSelect}
        placeholder={t("calcSearchPlaceholder")}
        className="pl-9"
      />
    </form>
  );
}
