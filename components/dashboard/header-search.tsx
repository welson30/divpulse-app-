"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TickerLogo } from "@/components/dashboard/ticker-logo";
import { getCategoryStyle } from "@/components/dashboard/collection-category-style";
import { NAV_SECTIONS } from "@/components/dashboard/sidebar";
import { searchTickers, type TickerSearchResult } from "@/lib/tickers/search";
import { listCollectionsForSearch, type CollectionSearchResult } from "@/app/(dashboard)/collections/actions";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; Icon: React.ComponentType<{ className?: string }> };
const PAGES: NavLink[] = NAV_SECTIONS.flatMap((section) => section.links).filter(
  (link): link is NavLink => !link.action && !link.href.startsWith("mailto:"),
);
const DEBOUNCE_MS = 250;

/**
 * Global ⌘K / Ctrl+K command palette — search across pages, tickers (any
 * symbol Yahoo knows, same backend as the ticker autocomplete), and
 * collections. Reuses the existing searchTickers server action rather
 * than a new endpoint; collections are small enough to fetch once, on
 * first open, and filter client-side instead of round-tripping per
 * keystroke.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tickerResults, setTickerResults] = useState<TickerSearchResult[]>([]);
  const [collections, setCollections] = useState<CollectionSearchResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      if (collections === null) listCollectionsForSearch().then(setCollections);
    } else {
      setQuery("");
      setTickerResults([]);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function handleChange(next: string) {
    setQuery(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (next.trim().length === 0) {
      setTickerResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setTickerResults(await searchTickers(next));
      });
    }, DEBOUNCE_MS);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const trimmed = query.trim().toLowerCase();
  const matchedPages = trimmed.length === 0 ? PAGES : PAGES.filter((p) => p.label.toLowerCase().includes(trimmed));
  const matchedCollections = (collections ?? []).filter(
    (c) => trimmed.length > 0 && (c.name.toLowerCase().includes(trimmed) || c.category.toLowerCase().includes(trimmed)),
  );
  const hasResults = matchedPages.length > 0 || tickerResults.length > 0 || matchedCollections.length > 0;

  return (
    <>
      {/* Desktop: a real, visible search bar, centered in the header
          regardless of how wide the logo/icon-cluster on either side are —
          Topbar's <header> is `relative` for exactly this. */}
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="hidden h-10 max-w-[448px] min-w-0 flex-1 items-center gap-3 rounded-[10px] border border-[#22262c] bg-[#121417] px-[13.8px] text-left text-[#6c737f] transition-colors hover:border-[#2e343b] lg:flex"
      >
        <FigmaIcon src="/marketing/dashboard/icon-search.svg" className="size-4 text-[#6c737f]" />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[23.1px]">Search holdings, payments, tickers</span>
        <kbd className="shrink-0 rounded-[4px] border border-[#2e343b] px-[5.8px] py-[1.8px] text-[10px] leading-[16.5px] text-[#6c737f]">
          ⌘K
        </kbd>
      </button>

      {/* Mobile: icon-only trigger, same palette. */}
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Search"
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#121417] text-[#99a1ac] transition-colors hover:text-[#f2f4f7] lg:hidden"
      >
        <FigmaIcon src="/marketing/dashboard/icon-search.svg" className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[18%] max-w-xl translate-y-0 gap-0 p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>

          <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3.5">
            <FigmaIcon src="/marketing/dashboard/icon-search.svg" className="size-4 text-text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const first = tickerResults[0];
                  const firstCollection = matchedCollections[0];
                  const firstPage = matchedPages[0];
                  if (first) go(`/tickers/${first.ticker}`);
                  else if (firstCollection) go(`/collections/${firstCollection.id}`);
                  else if (firstPage) go(firstPage.href);
                }
              }}
              placeholder="Search stocks, holdings, or collections..."
              className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!hasResults ? (
              <p className="px-2.5 py-6 text-center text-sm text-text-secondary">No results for “{query}”.</p>
            ) : (
              <>
                {matchedPages.length > 0 ? (
                  <div className="mb-1">
                    <div className="px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.06em] text-text-secondary uppercase">
                      Pages
                    </div>
                    {matchedPages.map((page) => (
                      <button
                        key={`${page.label}-${page.href}`}
                        type="button"
                        onClick={() => go(page.href)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
                      >
                        <page.Icon className="size-4 shrink-0 text-text-secondary" aria-hidden />
                        <span className="text-sm text-text-primary">{page.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {tickerResults.length > 0 ? (
                  <div className="mb-1">
                    <div className="px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.06em] text-text-secondary uppercase">
                      Tickers
                    </div>
                    {tickerResults.map((result) => (
                      <button
                        key={result.ticker}
                        type="button"
                        onClick={() => go(`/tickers/${result.ticker}`)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
                      >
                        <TickerLogo ticker={result.ticker} logoUrl={result.logoUrl} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-sm font-semibold text-text-primary">{result.ticker}</span>
                          <span className="block truncate text-xs text-text-secondary">{result.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {matchedCollections.length > 0 ? (
                  <div>
                    <div className="px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.06em] text-text-secondary uppercase">
                      Collections
                    </div>
                    {matchedCollections.map((collection) => {
                      const style = getCategoryStyle(collection.category);
                      const Icon = style.icon;
                      return (
                        <button
                          key={collection.id}
                          type="button"
                          onClick={() => go(`/collections/${collection.id}`)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
                        >
                          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", style.chipClass)}>
                            <Icon className="size-3.5" aria-hidden />
                          </span>
                          <span className="text-sm text-text-primary">{collection.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
            {isPending ? <p className="px-2.5 pt-1 pb-2 text-xs text-text-secondary">Searching…</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
