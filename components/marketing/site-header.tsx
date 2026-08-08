"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#dividend-alerts", label: "Dividend alerts" },
  { href: "#connections", label: "Connections" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Figma Header node 1:2452 — fixed 96.8px band above Main */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pp-site-header sticky top-0 z-50 h-16 shrink-0 border-b border-[#22262c] bg-[rgba(11,12,14,0.9)] backdrop-blur-[12px] min-[1200px]:h-[96.8px]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center px-4 sm:px-8 min-[1200px]:px-[60px]">
        <div className="flex h-full w-full max-w-[1320px] items-center justify-between gap-4 min-[1200px]:px-12">
          <Link
            href="/"
            className="relative h-9 w-[120px] shrink-0 min-[1200px]:h-[59px] min-[1200px]:w-[196px]"
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

          <nav className="hidden items-center gap-1 min-[1200px]:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[14px] px-4 py-[9.5px] text-[17px] font-medium leading-7 text-[#99a1ac] transition-colors hover:text-[#f2f4f7]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-[14px] border border-[#2e343b] bg-[#16191d] px-5 text-[16px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/40 min-[1200px]:h-14 min-[1200px]:text-[17px]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="relative flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#4c82f7] px-5 text-[16px] font-semibold text-white shadow-[0px_10px_30px_-12px_#4c82f7] transition-[filter] hover:brightness-110 min-[1200px]:h-14 min-[1200px]:px-7 min-[1200px]:text-[17px]"
            >
              Get Started Free
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/header/arrow-right.svg" alt="" width={19} height={19} className="size-[19px]" />
            </Link>
          </div>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[12px] border border-[#2e343b] bg-[#16191d] text-[#f2f4f7] min-[1200px]:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-4 flex-col gap-1">
              <span className={cn("h-0.5 w-full bg-current transition-transform", open && "translate-y-1.5 rotate-45")} />
              <span className={cn("h-0.5 w-full bg-current transition-opacity", open && "opacity-0")} />
              <span className={cn("h-0.5 w-full bg-current transition-transform", open && "-translate-y-1.5 -rotate-45")} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "absolute inset-x-0 top-full border-b border-t border-[#22262c] bg-[rgba(11,12,14,0.98)] min-[1200px]:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-[1320px] flex-col gap-1 px-4 py-4 lg:px-[108px]" aria-label="Mobile">
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
              className="flex h-12 items-center justify-center rounded-[14px] border border-[#2e343b] bg-[#16191d] text-[16px] font-medium text-[#f2f4f7]"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#4c82f7] text-[16px] font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Get Started Free
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/header/arrow-right.svg" alt="" width={19} height={19} className="size-[19px]" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
