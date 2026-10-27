"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Loader2, TrendingUp } from "lucide-react";
import { CURATED_LISTS, TICKER_FREQUENCY } from "@/lib/etf-explorer/curated-lists";

type Props = {
  tickers: string[];
};

// Build a flat, deduplicated lookup of ticker → frequency label for suggestions
const ALL_KNOWN = Array.from(
  new Map(
    CURATED_LISTS.flatMap((l) =>
      l.tickers.map((t) => [t, TICKER_FREQUENCY[t] ?? null])
    )
  ).entries()
).map(([ticker, freq]) => ({ ticker, freq }));

const FREQ_COLOR: Record<string, string> = {
  Monthly: "text-blue-400",
  Quarterly: "text-violet-400",
  Weekly: "text-amber-400",
};

export function EtfComparePicker({ tickers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const canAdd = tickers.length < 3;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtered suggestions
  const suggestions = query.trim().length >= 1
    ? ALL_KNOWN
        .filter(
          ({ ticker }) =>
            ticker.startsWith(query.trim().toUpperCase()) &&
            !tickers.includes(ticker)
        )
        .slice(0, 8)
    : [];

  const showDropdown = focused && adding && suggestions.length > 0;

  function navigate(next: string[]) {
    const url = `/etf-explorer/compare?tickers=${next.join(",")}`;
    startTransition(() => {
      router.replace(url);
    });
  }

  function removeTicker(ticker: string) {
    navigate(tickers.filter((t) => t !== ticker));
  }

  function addTicker(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (t.length > 6 || !/^[A-Z0-9.^-]+$/.test(t)) {
      setError("Enter a valid ticker symbol (e.g. JEPI, SCHD, O)");
      return;
    }
    if (tickers.includes(t)) {
      setError(`${t} is already in the comparison`);
      return;
    }
    if (!canAdd) {
      setError("Maximum 3 ETFs. Remove one first.");
      return;
    }
    setError(null);
    setQuery("");
    setAdding(false);
    setFocused(false);
    navigate([...tickers, t]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTicker(query);
    if (e.key === "Escape") {
      setAdding(false);
      setQuery("");
      setError(null);
      setFocused(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
          Comparing
        </span>
        {isPending && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
            <Loader2 className="size-3 animate-spin" />
            Fetching data…
          </span>
        )}
      </div>

      {/* Ticker chips + add button */}
      <div className="flex flex-wrap items-center gap-2">
        {tickers.map((ticker) => (
          <div
            key={ticker}
            className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 pl-3 pr-2 py-1.5"
          >
            <span className="font-mono text-sm font-semibold text-blue-300">
              {ticker}
            </span>
            <button
              type="button"
              onClick={() => removeTicker(ticker)}
              className="flex items-center justify-center rounded-full p-0.5 text-blue-400/60 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
              aria-label={`Remove ${ticker}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {/* Empty slot placeholders */}
        {Array.from({ length: Math.max(0, 2 - tickers.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-8 w-16 items-center justify-center rounded-full border border-dashed border-border-interactive"
          >
            <span className="font-mono text-[10px] text-text-secondary/40">ETF</span>
          </div>
        ))}

        {/* Add button */}
        {canAdd && !adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError(null);
              setTimeout(() => {
                inputRef.current?.focus();
                setFocused(true);
              }, 50);
            }}
            className="flex h-8 items-center gap-1.5 rounded-full border border-dashed border-border-interactive px-3 font-mono text-xs text-text-secondary transition-colors hover:border-blue-500 hover:text-blue-400"
          >
            <Plus className="size-3" />
            Add ETF
          </button>
        )}
      </div>

      {/* Inline search with autocomplete */}
      {adding && (
        <div className="flex flex-col gap-1.5" ref={wrapperRef}>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.toUpperCase());
                  setError(null);
                  setFocused(true);
                }}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Ticker… JEPI, VOO, SCHD"
                className="w-full rounded-xl border border-border-interactive bg-surface-hover py-2 pl-9 pr-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none"
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Autocomplete dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border-interactive bg-[#0d1117] shadow-xl shadow-black/50">
                  {suggestions.map(({ ticker, freq }) => (
                    <button
                      key={ticker}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur
                        addTicker(ticker);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-surface-hover"
                    >
                      <span className="font-mono text-sm font-semibold text-text-primary">
                        {ticker}
                      </span>
                      {freq && (
                        <span className={`flex items-center gap-1 font-mono text-[10px] font-semibold ${FREQ_COLOR[freq] ?? "text-text-secondary"}`}>
                          {freq === "Weekly" && <TrendingUp className="size-2.5" />}
                          {freq}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => addTicker(query)}
              disabled={!query.trim()}
              className="rounded-xl bg-blue-500 px-4 py-2 font-sans text-xs font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setQuery("");
                setError(null);
                setFocused(false);
              }}
              className="font-mono text-xs text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="font-mono text-[11px] text-red-400">{error}</p>
          )}
          <p className="font-mono text-[10px] text-text-secondary/60">
            Enter to add · Esc to cancel · up to 3 ETFs
          </p>
        </div>
      )}
    </div>
  );
}
