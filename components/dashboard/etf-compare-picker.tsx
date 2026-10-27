"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Loader2 } from "lucide-react";

type Props = {
  tickers: string[];
};

export function EtfComparePicker({ tickers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = tickers.length < 3;

  function navigate(next: string[]) {
    const url = `/etf-explorer/compare?tickers=${next.join(",")}`;
    startTransition(() => {
      router.replace(url);
    });
  }

  function removeTicker(ticker: string) {
    navigate(tickers.filter((t) => t !== ticker));
  }

  function handleAdd() {
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    if (ticker.length > 6 || !/^[A-Z0-9.^-]+$/.test(ticker)) {
      setError("Enter a valid ticker symbol (e.g. JEPI, SCHD, O)");
      return;
    }
    if (tickers.includes(ticker)) {
      setError(`${ticker} is already in the comparison`);
      return;
    }
    if (!canAdd) {
      setError("Maximum 3 ETFs. Remove one first.");
      return;
    }
    setError(null);
    setQuery("");
    setAdding(false);
    navigate([...tickers, ticker]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setAdding(false);
      setQuery("");
      setError(null);
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

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - tickers.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-8 w-16 items-center justify-center rounded-full border border-dashed border-border-interactive"
          >
            <span className="font-mono text-[10px] text-text-secondary/40">ETF</span>
          </div>
        ))}

        {/* Add button / inline input */}
        {canAdd && !adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError(null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex h-8 items-center gap-1.5 rounded-full border border-dashed border-border-interactive px-3 font-mono text-xs text-text-secondary transition-colors hover:border-blue-500 hover:text-blue-400"
          >
            <Plus className="size-3" />
            Add ETF
          </button>
        )}
      </div>

      {/* Inline search input */}
      {adding && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ticker symbol… e.g. JEPI"
                className="w-full rounded-xl border border-border-interactive bg-surface-hover py-2 pl-9 pr-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none"
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
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
            Press Enter to add · Esc to cancel · up to 3 ETFs
          </p>
        </div>
      )}
    </div>
  );
}
