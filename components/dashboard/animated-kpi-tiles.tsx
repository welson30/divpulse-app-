"use client";

import { useEffect, useRef, useState } from "react";

type KPI = { label: string; value: string; sub: string; valueClass: string };

// One accent color per tile slot — green · blue · violet · gold
const ACCENTS = [
  { hex: "#3fbf87", glow: "rgba(63,191,135,0.55)",  bg: "rgba(63,191,135,0.07)",  shadow: "0 0 32px rgba(63,191,135,0.15)"  },
  { hex: "#60a5fa", glow: "rgba(96,165,250,0.55)",  bg: "rgba(96,165,250,0.07)",  shadow: "0 0 32px rgba(96,165,250,0.15)"  },
  { hex: "#a78bfa", glow: "rgba(167,139,250,0.55)", bg: "rgba(167,139,250,0.07)", shadow: "0 0 32px rgba(167,139,250,0.15)" },
  { hex: "#f59e0b", glow: "rgba(245,158,11,0.55)",  bg: "rgba(245,158,11,0.07)",  shadow: "0 0 32px rgba(245,158,11,0.15)"  },
];

function extractNumber(value: string): number | null {
  const clean = value.replace(/[$,%+\s]/g, "").replace(/k$/i, "000");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function reformat(original: string, progress: number): string {
  const raw = extractNumber(original);
  if (raw === null) return original;
  const current = raw * progress;
  if (original.startsWith("$")) {
    if (original.endsWith("k") || raw >= 1000) return `$${(current / 1000).toFixed(1)}k`;
    if (original.includes(".")) {
      const decimals = original.split(".")[1]?.replace(/[^0-9]/g, "").length ?? 2;
      return `$${current.toFixed(Math.min(decimals, 2))}`;
    }
    return `$${Math.round(current).toLocaleString("en-US")}`;
  }
  if (original.endsWith("%")) {
    const decimals = original.split(".")[1]?.replace(/[^0-9]/g, "").length ?? 2;
    return `${current.toFixed(decimals)}%`;
  }
  return original;
}

function AnimatedValue({ value, hex, glow }: { value: string; hex: string; glow: string }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 1100;

  useEffect(() => {
    startRef.current = null;
    setProgress(0);
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out quart — snappier finish
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <p
      className="relative z-[1] text-[26px] font-bold leading-none tracking-[-1px] tabular-nums min-[900px]:text-[30px]"
      style={{
        color: hex,
        filter: `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 20px ${glow.replace("0.55", "0.25")})`,
      }}
    >
      {reformat(value, progress)}
    </p>
  );
}

export function AnimatedKpiTiles({ kpis }: { kpis: KPI[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-[#1c2028] bg-[#1c2028] shadow-[0_8px_40px_rgba(0,0,0,0.45)] lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        return (
          <div
            key={kpi.label}
            className="group relative flex flex-col gap-[10px] overflow-hidden bg-[#0b0e12] px-5 py-6 transition-all duration-500 hover:bg-[#0e1219] min-[900px]:px-6"
            style={{
              borderTop: `2px solid ${accent.hex}`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms, background 0.3s ease`,
            }}
          >
            {/* Radial glow on hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${accent.bg} 0%, transparent 65%)`,
              }}
            />

            {/* Corner glow dot */}
            <div
              className="pointer-events-none absolute right-4 top-4 size-1.5 rounded-full opacity-60"
              style={{ backgroundColor: accent.hex, boxShadow: `0 0 8px ${accent.hex}` }}
            />

            {/* Label */}
            <p className="relative z-[1] text-[10px] font-semibold tracking-[2px] text-[#404858] uppercase">
              {kpi.label}
            </p>

            {/* Animated value */}
            <AnimatedValue value={kpi.value} hex={accent.hex} glow={accent.glow} />

            {/* Sub */}
            <p className="relative z-[1] text-[11px] leading-[1.6] tracking-[-0.1px] text-[#3d4554]">
              {kpi.sub}
            </p>

            {/* Bottom shimmer line on hover */}
            <div
              className="absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-700 group-hover:w-full"
              style={{ background: `linear-gradient(to right, transparent, ${accent.hex}40, transparent)` }}
            />
          </div>
        );
      })}
    </div>
  );
}
