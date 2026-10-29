"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search, X } from "lucide-react";
import { searchCollectionTickers } from "@/app/(dashboard)/collections/actions";
import { CollectionTable, type CollectionRow } from "@/components/dashboard/collection-table";

const DEBOUNCE_MS = 300;

/**
 * Free-text ticker search for Collections — independent of the
 * admin-curated lists below it, so a ticker outside every collection can
 * still be found and watched. Results render through CollectionTable,
 * which already has a per-row Watch button wired to any ticker.
 */
export function CollectionSearch({ sectorFilter }: { sectorFilter?: React.ReactNode }) {
  const t = useTranslations("dashboard.collections");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollectionRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(next: string) {
    setQuery(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = next.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const matches = await searchCollectionTickers(trimmed);
        setResults(matches);
        setSearched(true);
      });
    }, DEBOUNCE_MS);
  }

  function clear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAriaLabel")}
            className="h-11 w-full rounded-lg border border-input bg-transparent pr-10 pl-10 text-[15px] outline-none transition-colors placeholder:text-text-secondary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                aria-label={t("clearSearch")}
                className="text-text-secondary transition-colors hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        {sectorFilter}
      </div>

      {searched && !isPending ? (
        results.length === 0 ? (
          <p className=”text-sm text-text-secondary”>{t(“noMatches”, { query: query.trim() })}</p>
        ) : (
          <div className="flex flex-col gap-sp-2">
            <p className=”text-xs text-text-secondary”>
              {t(“resultsFor”, { count: results.length, query: query.trim() })}
            </p>
            <CollectionTable rows={results} />
          </div>
        )
      ) : null}
    </div>
  );
}
