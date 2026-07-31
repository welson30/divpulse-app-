"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { searchTickers, type TickerSearchResult } from "@/lib/tickers/search";
import { cn } from "@/lib/utils";

type TickerSearchComboboxProps = {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (result: TickerSearchResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

const DEBOUNCE_MS = 250;

/**
 * Ticker input with live autocomplete — type "KO" or "coca" and get "The
 * Coca-Cola Company" back, resolving the client's repeated complaint that
 * a bare ticker like QQQM means nothing to most people.
 *
 * Deliberately not built on a combobox library (cmdk isn't a dependency
 * here) — a debounced fetch, an arrow-key-navigable list, and a
 * click-outside handler cover everything this needs.
 *
 * Doesn't block manual entry: closing the list without picking a result
 * still submits whatever was typed, so an obscure or newly-listed ticker
 * Yahoo's search doesn't surface is never a dead end.
 */
export function TickerSearchCombobox({
  id,
  name,
  value,
  onValueChange,
  onSelect,
  placeholder,
  required,
  className,
}: TickerSearchComboboxProps) {
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(next: string) {
    onValueChange(next);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const matches = await searchTickers(next);
        setResults(matches);
        setOpen(matches.length > 0);
      });
    }, DEBOUNCE_MS);
  }

  function pick(result: TickerSearchResult) {
    onValueChange(result.ticker);
    onSelect(result);
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(results[activeIndex]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        maxLength={10}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-transparent px-3.5 text-[15px] uppercase outline-none transition-colors placeholder:text-text-secondary placeholder:normal-case focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
      />

      {open ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-card border border-border-subtle bg-surface-2 shadow-[0_24px_64px_-32px_rgba(0,0,0,0.8)]"
        >
          {results.map((result, i) => (
            <button
              key={result.ticker}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input so onBlur doesn't fire before the click registers
              onClick={() => pick(result)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                i === activeIndex ? "bg-surface-hover" : "hover:bg-surface-hover",
              )}
            >
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold text-text-primary">{result.ticker}</span>
                <span className="block truncate text-xs text-text-secondary">{result.name}</span>
              </span>
              {result.exchange ? (
                <span className="shrink-0 font-mono text-[10px] text-text-tertiary">{result.exchange}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
