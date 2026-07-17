"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LockNotification = {
  ticker: string;
  title: string;
  amount: string;
  meta: string;
  when: string;
};

const NOTIFICATIONS: LockNotification[] = [
  { ticker: "KO", title: "Dividend received · KO", amount: "+$46.20", meta: "Fidelity · Payment confirmed", when: "now" },
  { ticker: "JNJ", title: "Dividend received · JNJ", amount: "+$128.50", meta: "Schwab · Payment confirmed", when: "2m ago" },
  { ticker: "PG", title: "Dividend received · PG", amount: "+$9.84", meta: "Fidelity · Payment confirmed", when: "3d ago" },
  { ticker: "O", title: "Dividend received · O", amount: "+$18.44", meta: "Schwab · Payment confirmed", when: "1w ago" },
];

// The lock screen tells one story with the rest of the page: the demo
// portfolio's payments land at 9:02 AM. A live device clock (4:15 AM on
// someone's first visit) breaks that story, so the time is pinned.
const NARRATIVE_TIME = "9:02";

function BatteryGlyph() {
  return (
    <div className="ml-[4px] flex h-[8px] w-[17px] items-center rounded-[3px] border border-white/50 p-px">
      <div className="h-full w-[72%] rounded-[1px] bg-white" />
      <div aria-hidden className="ml-[1px] h-[4px] w-[1.5px] rounded-r-[1px] bg-white/50" />
    </div>
  );
}

function SignalGlyph() {
  const heights = [3, 5, 7, 9];
  return (
    <div className="flex items-end gap-[2.5px]">
      {heights.map((h) => (
        <span key={h} className="block w-[3px] rounded-[0.5px] bg-white" style={{ height: h }} />
      ))}
    </div>
  );
}

function WifiGlyph() {
  return (
    <svg viewBox="0 0 16 12" className="h-[10px] w-[13px]" fill="none">
      <path d="M1 4.5C4.8 1 11.2 1 15 4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.95" />
      <path d="M3.3 7.2C5.9 5 10.1 5 12.7 7.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.95" />
      <circle cx="8" cy="10" r="1.1" fill="white" />
    </svg>
  );
}

function NotificationGlyph() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- static local asset, sized for a 16px lock-screen app icon */
    <img src="/logo.svg" alt="" width={16} height={16} className="block h-4 w-4 rounded-[5px]" />
  );
}

const DEVICE_WIDTH = 272;
const DEVICE_HEIGHT = 560;
const MOBILE_SCALE = 0.82;

/**
 * iPhone lock-screen mockup: a physically plausible titanium-edge frame
 * (dual-tone bezel, specular highlight, drop shadow with a soft green
 * bounce-light per the brand's CTA-glow rule) around a wallpaper + Dynamic
 * Island + notification stack. Content is the same receipt data used
 * elsewhere on the page; every accent color still resolves to PaidPrime
 * tokens (--green-500 etc.), not new hex values — only the device chrome
 * itself (bezel/glass) uses true-black/neutral tones a real iPhone has.
 *
 * Below `sm` the device is rendered at MOBILE_SCALE via `transform: scale()`
 * (not by resizing width/height) so every fixed-px child — status bar,
 * notification cards, clock — shrinks proportionally instead of clipping.
 * The wrapper reserves the post-scale box size so layout doesn't leave a
 * dead gap where the unscaled height used to be.
 */
export function PhoneMockup({ className }: { className?: string }) {
  const time = NARRATIVE_TIME;
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));

    const mql = window.matchMedia("(min-width: 640px)");
    const applyScale = () => setScale(mql.matches ? 1 : MOBILE_SCALE);
    applyScale();
    mql.addEventListener("change", applyScale);

    return () => {
      cancelAnimationFrame(id);
      mql.removeEventListener("change", applyScale);
    };
  }, []);

  return (
    <div className={cn("flex justify-center perspective-[1400px]", className)}>
      <div className="relative" style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}>
        <div
          className="absolute top-0 left-0 origin-top-left select-none transition-transform duration-700 ease-out"
          style={{
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            transform: mounted
              ? `scale(${scale})`
              : `scale(${scale}) rotateY(-10deg) rotateX(4deg)`,
          }}
        >
          {/* ambient green bounce-light behind the device, per the brand's CTA-glow rule */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-70 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(34, 197, 94,0.16), transparent)" }}
          />

          {/* titanium frame */}
          <div
            className="absolute inset-0 rounded-[54px] p-[3px] shadow-[0_60px_120px_-32px_rgba(0,0,0,0.75),0_8px_24px_-8px_rgba(0,0,0,0.5)]"
            style={{
              background: "linear-gradient(155deg, #3a3b3d 0%, #17181a 22%, #0c0d0e 55%, #232426 85%, #414244 100%)",
            }}
          >
            {/* inner bezel lip */}
            <div className="relative h-full w-full rounded-[51px] bg-black p-[2px]">
              {/* side controls */}
              <span aria-hidden className="absolute top-[118px] left-[-3px] h-[28px] w-[3px] rounded-l-[2px] bg-[#2c2d2f]" />
              <span aria-hidden className="absolute top-[156px] left-[-3px] h-[46px] w-[3px] rounded-l-[2px] bg-[#2c2d2f]" />
              <span aria-hidden className="absolute top-[130px] right-[-3px] h-[64px] w-[3px] rounded-r-[2px] bg-[#2c2d2f]" />

              {/* screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[49px]">
                {/* wallpaper */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(120% 65% at 50% 0%, #132019 0%, var(--bg-base) 46%, #050705 100%)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.35]"
                  style={{ background: "radial-gradient(60% 40% at 82% 8%, rgba(34, 197, 94,0.22), transparent 70%)" }}
                />
                {/* watermark brand mark, faint */}
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative local asset */}
                <img
                  src="/logo.svg"
                  alt=""
                  className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 opacity-[0.06]"
                  width={176}
                  height={176}
                />

                {/* status bar */}
                <div className="relative z-10 flex items-center justify-between px-6 pt-3.5">
                  <span className="font-sans text-[13px] font-semibold tracking-tight text-white">{time}</span>
                  <div className="flex items-center gap-[5px]">
                    <SignalGlyph />
                    <WifiGlyph />
                    <BatteryGlyph />
                  </div>
                </div>

                {/* dynamic island */}
                <div className="absolute top-3.5 left-1/2 z-20 h-[30px] w-[92px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />

                {/* lock-screen clock */}
                <div className="relative z-10 mt-3 text-center">
                  <div className="font-display text-[58px] leading-none font-extralight tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.4)]">
                    {time}
                  </div>
                  <div className="mt-1 font-mono text-[11px] tracking-[0.02em] text-white/55">Thursday, July 3 · 4 payments</div>
                </div>

                {/* notification stack — each card "arrives" like a real lock-
                    screen push: drops in from above with a spring overshoot,
                    scales up from slightly compressed, and flashes a brief
                    green edge-glow on landing. Plain CSS animation (not a
                    JS-gated transition) so it plays without JavaScript, and
                    motion-safe respects prefers-reduced-motion. */}
                <div className="relative z-10 mt-4 flex flex-col gap-[6px] px-3">
                  {NOTIFICATIONS.map((n, i) => (
                    <div
                      key={n.ticker + n.when}
                      className="origin-top rounded-[10px] border border-white/[0.07] bg-white/[0.08] px-[9px] py-[7px] opacity-0 backdrop-blur-xl motion-safe:animate-[notif-drop_.62s_cubic-bezier(.34,1.35,.4,1)_both]"
                      style={{
                        animationDelay: `${240 + i * 260}ms`,
                        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="mb-[3px] flex items-center gap-1">
                        <NotificationGlyph />
                        <span className="flex-1 font-sans text-[9px] font-medium text-white/40">PaidPrime</span>
                        <span className="font-sans text-[8px] text-white/25">{n.when}</span>
                      </div>
                      <div className="mb-0.5 text-[10px] leading-tight font-bold text-white">{n.title}</div>
                      <div className="font-mono text-[17px] leading-none font-extrabold tracking-[-0.02em] text-green-500 tabular-nums">
                        {n.amount}
                      </div>
                      <div className="mt-0.5 text-[8px] leading-tight text-white/30">{n.meta} ✓</div>
                    </div>
                  ))}
                </div>
                <style>{`
                  @keyframes notif-drop {
                    0% {
                      opacity: 0;
                      transform: translateY(-18px) scale(0.92);
                      box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 0 rgba(34, 197, 94,0);
                    }
                    55% {
                      opacity: 1;
                      transform: translateY(2px) scale(1.015);
                      box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 20px 2px rgba(34, 197, 94,0.28);
                    }
                    100% {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                      box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 0 rgba(34, 197, 94,0);
                    }
                  }
                `}</style>

                {/* home indicator */}
                <div className="absolute bottom-2 left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/30" />

                {/* subtle top glass sheen */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 18%)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
