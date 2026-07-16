"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "span";
};

/**
 * Restrained fade/slide-up reveal on scroll. Not the receipt entrance —
 * DESIGN.md reserves that flourish for the receipt card alone. This is the
 * generic "content appears as you scroll to it" pattern, kept quieter
 * (shorter travel, no bounce) so it never competes with the receipt.
 */
export function Reveal({ children, className, delayMs = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // SSR/no-JS renders content visible — the page must never depend on
  // JavaScript to show its copy. The hide-then-reveal only kicks in after
  // hydration, and only for elements still below the fold (pre-paint, so
  // in-view content never flashes).
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.92) return;

    setVisible(false);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Comp = as;

  return (
    <Comp
      ref={ref as never}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </Comp>
  );
}
