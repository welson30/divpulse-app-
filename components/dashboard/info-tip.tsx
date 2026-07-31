"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Coords = { top: number; left: number; placement: "above" | "below" };

const WIDTH = 224; // keep in sync with the w-56 below
const GAP = 8;

/**
 * Small "?" affordance that explains a piece of financial jargon.
 *
 * Opens on hover for mice, on focus for keyboards, and on click for
 * touch — hover alone would leave the explanation unreachable on a phone,
 * which is where a lot of this app gets read. Escape closes it, and the
 * text is wired via aria-describedby so screen readers get it too rather
 * than announcing a bare question mark.
 *
 * Positioned `fixed` against measured viewport coordinates rather than
 * absolutely against the trigger. These tips live in table headers, and
 * every table sits inside an `overflow-x-auto` wrapper for horizontal
 * scrolling — which establishes a clipping context that silently cut the
 * bubble off. Fixed positioning escapes that; the trade-off is the
 * coordinates go stale on scroll, so it closes on scroll instead.
 */
export function InfoTip({ label, className }: { label: string; className?: string }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    // Flip below when there isn't room above, and keep the bubble inside
    // the viewport horizontally so tips in the last column don't spill.
    const placement: Coords["placement"] = r.top < 120 ? "below" : "above";
    const half = WIDTH / 2;
    const left = Math.min(Math.max(r.left + r.width / 2, half + GAP), window.innerWidth - half - GAP);
    const top = placement === "above" ? r.top - GAP : r.bottom + GAP;

    setCoords({ top, left, placement });
  };

  const close = () => setCoords(null);

  useEffect(() => {
    if (!coords) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Capture phase so a scroll inside the table wrapper closes it too,
    // not just a scroll of the page itself.
    const onScroll = () => close();

    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [coords]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="What does this mean?"
        aria-describedby={coords ? id : undefined}
        aria-expanded={coords != null}
        onClick={() => (coords ? close() : open())}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={cn(
          // These sit inside table headers styled `font-mono uppercase
          // tracking-[0.06em]`. Without resetting the font and tracking
          // the glyph inherits that letter-spacing and sits visibly
          // off-centre in its circle, and `align-middle` keeps it on the
          // text baseline rather than riding high next to the label.
          "inline-flex size-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-border-interactive pl-px align-middle font-sans text-[9px] leading-none font-semibold tracking-normal text-text-secondary normal-case transition-colors hover:border-green-500 hover:bg-green-500/10 hover:text-green-500",
          className,
        )}
      >
        ?
      </button>
      {coords
        ? createPortal(
            <div
              role="tooltip"
              id={id}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: WIDTH,
                transform: `translate(-50%, ${coords.placement === "above" ? "-100%" : "0"})`,
              }}
              className="pointer-events-none z-100 rounded-[8px] border border-border-subtle bg-surface-2 px-2.5 py-2 text-left text-[11px] leading-relaxed font-normal tracking-normal whitespace-normal text-text-primary normal-case shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)]"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

