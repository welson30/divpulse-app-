"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type KPI = {
  label: string;
  value: string;
  sub: string;
  valueClass: string;
};

/** Extract the numeric portion from a formatted value like "$1,564.00" or "6.71%" */
function extractNumber(value: string): number | null {
  const clean = value.replace(/[$,%+\s]/g, "").replace(/k$/i, "000");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

/** Re-format a number to match the original value's style */
function reformat(original: string, progress: number): string {
  const raw = extractNumber(original);
  if (raw === null) return original;
  const current = raw * progress;

  if (original.startsWith("$")) {
    // Currency
    if (original.endsWith("k") || raw >= 1000) {
      return `$${(current / 1000).toFixed(1)}k`;
    }
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

function AnimatedValue({ value, valueClass }: { value: string; valueClass: string }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 900; // ms

  useEffect(() => {
    startRef.current = null;
    setProgress(0);

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      // Ease-out cubic
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <p className={cn("text-[22px] leading-[26px] tracking-[-0.52px] tabular-nums min-[900px]:text-[26px]", valueClass)}>
      {reformat(value, progress)}
    </p>
  );
}

export function AnimatedKpiTiles({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#22262c] bg-[#22262c] lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="flex flex-col gap-[7px] bg-[#121417] px-5 py-5 min-[900px]:px-6">
          <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">{kpi.label}</p>
          <AnimatedValue value={kpi.value} valueClass={kpi.valueClass} />
          <p className="text-[12px] leading-[19.8px] tracking-[-0.24px] text-[#99a1ac]">{kpi.sub}</p>
        </div>
      ))}
    </div>
  );
}
