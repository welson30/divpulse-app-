"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { PrimaryCta } from "@/components/marketing/primary-cta";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#dividend-alerts", label: "Dividend alerts" },
  { href: "#connections", label: "Connections" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Ease-out cubic — progress feels finished before you stop scrolling. */
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Fixed header that stays on screen for the whole page.
 * Scroll progress (0→1 over ~100px) smoothly morphs full-bleed → floating oval.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      setDesktop(window.matchMedia("(min-width: 1200px)").matches);
      const next = easeOutCubic(Math.min(1, Math.max(0, window.scrollY / 100)));
      setProgress((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  const t = progress;
  const scrolled = t > 0.55;

  const insetX = lerp(0, desktop ? 24 : 12, t);
  const insetTop = lerp(0, desktop ? 16 : 12, t);
  const barHeight = lerp(desktop ? 96.8 : 64, desktop ? 68 : 56, t);
  const radius = lerp(0, 999, t);
  const borderOpacity = lerp(0, 1, t);
  const bottomBorderOpacity = lerp(1, 0, t);
  const shadowOpacity = lerp(0, 0.75, t);
  const logoH = lerp(desktop ? 59 : 36, desktop ? 40 : 32, t);
  const logoW = lerp(desktop ? 196 : 120, desktop ? 136 : 108, t);
  const ctaH = lerp(desktop ? 56 : 44, desktop ? 44 : 40, t);

  const shellStyle = {
    paddingLeft: insetX,
    paddingRight: insetX,
    paddingTop: insetTop,
  } satisfies CSSProperties;

  const barStyle = {
    height: barHeight,
    borderRadius: radius,
    borderTopColor: `rgba(46, 52, 59, ${borderOpacity})`,
    borderRightColor: `rgba(46, 52, 59, ${borderOpacity})`,
    borderLeftColor: `rgba(46, 52, 59, ${borderOpacity})`,
    borderBottomColor: `rgba(34, 38, 44, ${Math.max(borderOpacity, bottomBorderOpacity)})`,
    boxShadow: `0 16px 48px -16px rgba(0, 0, 0, ${shadowOpacity})`,
    backgroundColor: `rgba(11, 12, 14, ${lerp(0.9, 0.88, t)})`,
  } satisfies CSSProperties;

  return (
    <>
      {/* Reserves resting header height so content doesn’t jump under fixed bar */}
      <div
        aria-hidden
        className="pointer-events-none h-16 shrink-0 min-[1200px]:h-[96.8px]"
      />

      <header
        className="pp-site-header pointer-events-none fixed inset-x-0 top-0 z-50"
        data-scrolled={scrolled ? "true" : undefined}
        style={shellStyle}
      >
        <div
          className="pointer-events-auto relative mx-auto flex w-full max-w-[1440px] items-center border backdrop-blur-xl will-change-[height,border-radius,padding,box-shadow]"
          style={barStyle}
        >
          <div
            className="mx-auto flex h-full w-full max-w-[1320px] items-center justify-between gap-3"
            style={{
              paddingLeft: lerp(desktop ? 48 : 16, desktop ? 28 : 16, t),
              paddingRight: lerp(desktop ? 48 : 16, desktop ? 28 : 16, t),
            }}
          >
            <Link
              href="/"
              className="relative shrink-0"
              style={{ width: logoW, height: logoH }}
              aria-label="PaidPrime home"
            >
              <Image
                src="/marketing/header/logo.png"
                alt="PaidPrime"
                fill
                priority
                className="object-contain object-left"
                sizes="196px"
              />
            </Link>

            <nav
              className="hidden items-center gap-0.5 min-[1200px]:flex"
              aria-label="Primary"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-[15px] font-medium leading-6 text-[#99a1ac] transition-colors hover:text-[#f2f4f7] min-[1200px]:px-4 min-[1200px]:text-[17px] min-[1200px]:leading-7"
                  style={{
                    fontSize: lerp(17, 15, t),
                    paddingBlock: lerp(9.5, 8, t),
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2.5 md:flex min-[1200px]:gap-3">
              <Link
                href="/login"
                className="flex items-center border border-[#2e343b] bg-[#16191d] px-4 font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/40 min-[1200px]:px-5"
                style={{
                  height: ctaH,
                  borderRadius: lerp(14, 999, t),
                  fontSize: lerp(desktop ? 17 : 16, 15, t),
                }}
              >
                Sign in
              </Link>
              <PrimaryCta
                href="/signup"
                className="px-5 min-[1200px]:px-7"
                style={{
                  height: ctaH,
                  borderRadius: lerp(14, 999, t),
                  fontSize: lerp(desktop ? 17 : 16, 15, t),
                  paddingInline: lerp(desktop ? 28 : 20, 20, t),
                }}
              >
                Get Started Free
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/header/arrow-right.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="size-[19px] transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{
                    width: lerp(19, 16, t),
                    height: lerp(19, 16, t),
                  }}
                />
              </PrimaryCta>
            </div>

            <button
              type="button"
              className="flex items-center justify-center border border-[#2e343b] bg-[#16191d] text-[#f2f4f7] min-[1200px]:hidden"
              style={{
                width: lerp(40, 36, t),
                height: lerp(40, 36, t),
                borderRadius: lerp(12, 999, t),
              }}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <span className="flex w-4 flex-col gap-1">
                <span
                  className={cn(
                    "h-0.5 w-full bg-current transition-transform duration-200",
                    open && "translate-y-1.5 rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "h-0.5 w-full bg-current transition-opacity duration-200",
                    open && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "h-0.5 w-full bg-current transition-transform duration-200",
                    open && "-translate-y-1.5 -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>

          <div
            id="mobile-nav"
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+10px)] border border-[#22262c] bg-[rgba(11,12,14,0.98)] backdrop-blur-xl min-[1200px]:hidden",
              open ? "block" : "hidden",
            )}
            style={{ borderRadius: lerp(16, 24, t) }}
          >
            <nav
              className="mx-auto flex max-w-[1320px] flex-col gap-1 px-4 py-4"
              aria-label="Mobile"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[14px] px-4 py-3 text-[16px] font-medium text-[#99a1ac] hover:bg-[#16191d] hover:text-[#f2f4f7]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[#22262c] pt-4 md:hidden">
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-full border border-[#2e343b] bg-[#16191d] text-[16px] font-medium text-[#f2f4f7]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              <PrimaryCta
                href="/signup"
                className="h-12 rounded-full text-[16px]"
                onClick={() => setOpen(false)}
              >
                Get Started Free
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/header/arrow-right.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="size-[19px] transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </PrimaryCta>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
