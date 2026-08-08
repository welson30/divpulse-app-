"use client";

import { useEffect, useRef, useState } from "react";

type StatCountUpProps = {
  end: number;
  prefix?: string;
  suffix?: string;
  /** Insert thousands separators (e.g. 38,400). */
  commas?: boolean;
  durationMs?: number;
  className?: string;
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function formatValue(n: number, commas: boolean) {
  const rounded = Math.round(n);
  return commas ? rounded.toLocaleString("en-US") : String(rounded);
}

/**
 * Scroll-triggered count-up for hero stats.
 * Matches receipt-card easing (easeOutCubic) + reduced-motion guard.
 * SSR shows the final value so content never depends on JS.
 */
export function StatCountUp({
  end,
  prefix = "",
  suffix = "",
  commas = false,
  durationMs = 1400,
  className,
}: StatCountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(end);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || startedRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setValue(end);
      return;
    }

    const play = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      setValue(0);
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / durationMs, 1);
        setValue(end * easeOutCubic(p));
        if (p < 1) rafRef.current = requestAnimationFrame(step);
        else setValue(end);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.92 && rect.bottom >= 0) {
      // Already in view on load — count after a frame so the 0→end is visible
      rafRef.current = requestAnimationFrame(() => play());
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    setValue(0);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            play();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatValue(value, commas)}
      {suffix}
    </span>
  );
}
