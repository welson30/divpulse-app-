"use client";

import { useState, useId } from "react";
import { Calculator, ChevronRight } from "lucide-react";

type Props = {
  onAmountChange: (amount: number) => void;
  initialAmount?: number;
};

const PRESETS = [1_000, 5_000, 10_000, 25_000, 50_000];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(n);
}

export function EtfYieldCalculator({ onAmountChange, initialAmount = 10_000 }: Props) {
  const [raw, setRaw] = useState(String(initialAmount));
  const [active, setActive] = useState(initialAmount);
  const inputId = useId();

  function apply(value: string) {
    const num = Number(value.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(num) && num >= 0) {
      setActive(num);
      onAmountChange(num);
    }
  }

  function pickPreset(n: number) {
    setRaw(String(n));
    setActive(n);
    onAmountChange(n);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-gradient-to-br from-surface to-surface-hover p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Calculator className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Yield Calculator</p>
          <p className="text-xs text-text-secondary">See how much each ETF would pay you annually</p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={inputId} className="shrink-0 font-mono text-sm text-text-secondary">
          If I invest
        </label>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-text-secondary">
            $
          </span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            value={raw}
            onChange={(e: { target: { value: string } }) => setRaw(e.target.value)}
            onBlur={() => apply(raw)}
            onKeyDown={(e: { key: string }) => {
              if (e.key === "Enter") apply(raw);
            }}
            className="w-full rounded-lg border border-border-subtle bg-surface-hover py-2 pl-7 pr-3 font-mono text-sm text-text-primary placeholder:text-text-secondary focus:border-blue-500 focus:outline-none"
            placeholder="10000"
          />
        </div>
        <div className="flex items-center gap-1 font-mono text-sm text-text-secondary">
          <ChevronRight className="size-3.5 shrink-0" />
          <span>see income in table</span>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pickPreset(n)}
            className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
              active === n
                ? "bg-blue-500 text-white"
                : "border border-border-interactive text-text-secondary hover:border-blue-500 hover:text-blue-400"
            }`}
          >
            ${fmt(n)}
          </button>
        ))}
      </div>
    </div>
  );
}
