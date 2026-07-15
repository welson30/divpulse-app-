"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ReceiptCardProps = {
  ticker: string;
  name: string;
  cadence: string;
  amount: number;
  when: string;
  /** Delay before this card's entrance plays, for staggered feeds. */
  delayMs?: number;
  className?: string;
};

function formatAmount(v: number) {
  return `+$${v.toFixed(2)}`;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * The dividend "receipt" — the one component DESIGN.md allows to carry
 * personality: slide-up + fade entrance, 500ms cubic-bezier(.2,.8,.2,1),
 * plus a 600ms easeOutCubic count-up on the amount. Ported from
 * Design-System/kit/interactions.js's countUp/playEntrance, not
 * reinvented — same durations, same easing, same reduced-motion guard.
 */
export function ReceiptCard({ ticker, name, cadence, amount, when, delayMs = 0, className }: ReceiptCardProps) {
  const [entered, setEntered] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(amount);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setEntered(true);
      setDisplayAmount(amount);
      return;
    }

    setDisplayAmount(0);
    const enterTimer = setTimeout(() => setEntered(true), delayMs);

    let start: number | null = null;
    const duration = 600;
    function step(ts: number) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplayAmount(amount * easeOutCubic(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    const countTimer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(countTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // amount/delayMs are stable per-card props in practice; re-running on
    // identity change would just replay the same entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-card border border-border-subtle bg-surface p-sp-3",
        "transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]",
        entered ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-green-500" />
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle bg-surface-2 font-mono text-[11px] font-semibold text-text-secondary">
          {ticker}
        </div>
        <div className="min-w-0">
          <b className="block truncate font-mono text-sm font-semibold text-text-primary">{name}</b>
          <span className="block truncate text-xs text-text-secondary">{cadence}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-lg font-semibold tabular-nums text-green-500">
          {formatAmount(displayAmount)}
        </div>
        <div className="mt-0.5 text-xs text-text-secondary">{when}</div>
      </div>
    </div>
  );
}
