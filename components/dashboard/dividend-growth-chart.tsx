"use client";

import { useState } from "react";

export type AnnualIncomePoint = {
  year: number;
  total: number;
  complete: boolean;
};

function niceCeiling(max: number): number {
  if (max <= 0) return 1000;
  const padded = max * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * "YTD" only fits the year still in progress. An earlier year can also be
 * incomplete — recorded history usually starts mid-year, so the oldest point
 * covers part of a year — and calling that YTD would misread as a full-year
 * figure. It gets "partial" instead.
 */
function partialLabel(year: number, complete: boolean): string {
  if (complete) return "";
  return year === new Date().getUTCFullYear() ? "YTD" : "partial";
}

export function DividendGrowthChart({ data }: { data: AnnualIncomePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));
  const plotted = data;
  // A year-over-year chart needs at least one *finished* year to anchor
  // against. With only part-years recorded there is nothing to compare, and
  // a line drawn between two partial totals reads as a trend that doesn't
  // exist — so the card says what's missing instead of implying one.
  const hasComparableYear = plotted.some((d) => d.complete && d.total > 0);

  const xFor = (i: number, n: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yFor = (total: number) => 100 - (niceMax > 0 ? (total / niceMax) * 100 : 0);

  // Drawn as individual segments rather than one polyline so a segment
  // touching a partial year can be dashed. A solid line between two
  // part-years reads as a real trend when it isn't one: on a live portfolio
  // it sloped down from a year holding only 5 months of history to a year
  // still 4 months from finishing, implying a decline that hadn't happened.
  const segments = plotted.slice(0, -1).map((d, i) => {
    const next = plotted[i + 1]!;
    return {
      key: `${d.year}-${next.year}`,
      x1: xFor(i, plotted.length),
      y1: yFor(d.total),
      x2: xFor(i + 1, plotted.length),
      y2: yFor(next.total),
      provisional: !d.complete || !next.complete,
    };
  });

  const partialYears = plotted.filter((d) => !d.complete).map((d) => d.year);

  return (
    <section className="flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]">
      <header className="border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          Dividend growth
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
          Annual income received, year over year
        </p>
        {hasComparableYear && partialYears.length > 0 ? (
          <p className="mt-1 text-[12px] leading-[19.8px] text-[#6c737f]">
            {partialYears.join(" and ")} {partialYears.length === 1 ? "is" : "are"} shown dashed —{" "}
            {partialYears.length === 1 ? "it isn't a full year" : "neither is a full year"} yet.
          </p>
        ) : null}
      </header>
      <div className="px-4 pb-5 pt-4 min-[900px]:px-6">
        {!hasComparableYear ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-1.5 px-4 text-center">
            <p className="m-0 text-[13px] leading-[21.45px] text-[#99a1ac]">
              No complete calendar year of dividend history yet.
            </p>
            <p className="m-0 max-w-[380px] text-[12px] leading-[19.8px] text-[#6c737f]">
              Year-over-year growth appears once a full year has been recorded. Monthly income above shows what has
              landed so far.
            </p>
          </div>
        ) : (
          <div className="flex h-[240px] gap-2">
            <div className="flex w-9 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right font-[family-name:var(--font-outfit)] text-[11px] text-[#6c737f]">
              {ticks.map((t) => (
                <span key={t.p}>{t.label}</span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1">
                {ticks.map((t) => (
                  <div
                    key={t.p}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-[#22262c]"
                    style={{ bottom: `${t.p * 100}%` }}
                  />
                ))}
                <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {segments.map((s) => (
                    <line
                      key={s.key}
                      x1={s.x1}
                      y1={s.y1}
                      x2={s.x2}
                      y2={s.y2}
                      fill="none"
                      stroke="#3fbf87"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeOpacity={s.provisional ? 0.5 : 1}
                      strokeDasharray={s.provisional ? "4 4" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                {plotted.map((d, i) => {
                  const left = xFor(i, plotted.length);
                  const top = yFor(d.total);
                  const active = hover === i;
                  return (
                    <button
                      key={d.year}
                      type="button"
                      className="absolute z-[1] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3fbf87] bg-[#121417] outline-none"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${d.year}: ${formatMoney(d.total)}${
                        d.complete ? "" : ` (${partialLabel(d.year, d.complete)}, not a full year)`
                      }`}
                    >
                      {active ? (
                        <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[2] flex w-max -translate-x-1/2 flex-col rounded-[10px] border border-[#2e343b] bg-[#16191d] px-3 py-1.5 shadow-[0px_8px_12px_rgba(0,0,0,0.45)]">
                          <span className="text-left text-[10px] tracking-[1.6px] text-[#99a1ac] uppercase">
                            {d.year}
                            {d.complete ? "" : ` ${partialLabel(d.year, d.complete)}`}
                          </span>
                          <span className="text-left text-[13px] tracking-[-0.26px] text-[#f2f4f7]">
                            {formatMoney(d.total)}
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex">
                {plotted.map((d) => (
                  <div
                    key={d.year}
                    className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-outfit)] text-[11px] text-[#6c737f]"
                  >
                    {d.year}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
