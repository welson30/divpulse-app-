"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SparklinePoint } from "@/lib/dividend-data/types";
import type { YearlyReturnRow } from "@/lib/tickers/performance-metrics";

const Chart = dynamic(
  () => import("@/components/dashboard/portfolio-performance-chart").then((m) => m.PortfolioPerformanceChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-[10px] bg-[#16191d]" />,
  },
);

export type PerformanceKpi = {
  label: string;
  value: string;
  hint: string;
  tone?: "positive" | "negative" | "neutral";
};

type PerformanceBoardProps = {
  kpis: [PerformanceKpi, PerformanceKpi, PerformanceKpi, PerformanceKpi];
  chartPoints: SparklinePoint[];
  benchmarkPoints: SparklinePoint[];
  chartSubtitle: string;
  chartBadge: string | null;
  yearly: YearlyReturnRow[];
};

function formatSignedPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function pctClass(value: number | null, variant: "portfolio" | "spy"): string {
  if (value == null) return "text-[#6c737f]";
  if (value < 0) return "text-[#d8695f]";
  return variant === "portfolio" ? "text-[#3fbf87]" : "text-[#99a1ac]";
}

const CONTRIBUTION_COLORS = ["#4c82f7", "#3fbf87", "#e0a45c"] as const;
const CONTRIBUTION_KEYS = ["contribDividends", "contribPrice", "contribNew"] as const;

export function PerformanceBoard({
  kpis,
  chartPoints,
  benchmarkPoints,
  chartSubtitle,
  chartBadge,
  yearly,
}: PerformanceBoardProps) {
  const t = useTranslations("dashboard.performanceBoard");
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          {t("pageSubtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#22262c] bg-[#22262c] lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-[7px] bg-[#121417] px-5 py-5 min-[900px]:px-6">
            <p className="text-[11px] tracking-[1.76px] text-[#99a1ac] uppercase">{kpi.label}</p>
            <p
              className={cn(
                "text-[22px] leading-[26px] tracking-[-0.52px] min-[900px]:text-[26px]",
                kpi.tone === "positive" && "text-[#3fbf87]",
                kpi.tone === "negative" && "text-[#d8695f]",
                (kpi.tone == null || kpi.tone === "neutral") && "text-[#f2f4f7]",
              )}
            >
              {kpi.value}
            </p>
            <p className="text-[12px] leading-[19.8px] tracking-[-0.24px] text-[#99a1ac]">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="flex items-start justify-between gap-3 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              {t("chartTitle")}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{chartSubtitle}</p>
          </div>
          {chartBadge ? (
            <span
              className={cn(
                "mt-1 shrink-0 rounded-[8px] border px-2 py-[4px] text-[11px] tracking-[1.1px] uppercase",
                chartBadge.startsWith("-")
                  ? "border-[rgba(216,105,95,0.3)] bg-[#2a1614] text-[#d8695f]"
                  : "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
              )}
            >
              {chartBadge}
            </span>
          ) : null}
        </header>
        <div className="h-[240px] w-full px-2 pb-4 pt-2 min-[900px]:h-[280px] min-[900px]:px-3">
          {chartPoints.length < 2 ? (
            <div className="flex h-full items-center justify-center text-[13px] text-[#99a1ac]">
              {t("noOverlapHistory")}
            </div>
          ) : (
            <Chart points={chartPoints} benchmarkPoints={benchmarkPoints} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-[1.3fr_1fr]">
        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              {t("yearlyTitle")}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              {t("yearlySubtitle")}
            </p>
          </header>
          {yearly.length === 0 ? (
            <p className="px-6 py-8 text-[14px] leading-[23.1px] text-[#99a1ac]">
              {t("yearlyNoData")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-[#22262c]">
                    <th className="px-6 py-3 text-[11px] font-medium tracking-[1.54px] text-[#6c737f] uppercase">
                      {t("colYear")}
                    </th>
                    <th className="px-4 py-3 text-[11px] font-medium tracking-[1.54px] text-[#6c737f] uppercase">
                      {t("colPortfolio")}
                    </th>
                    <th className="px-4 py-3 text-[11px] font-medium tracking-[1.54px] text-[#6c737f] uppercase">
                      {t("colSP500")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((row) => (
                    <tr key={row.year} className="border-b border-[#22262c] last:border-b-0">
                      <td className="px-6 py-3.5 text-[14px] leading-[23.1px] tracking-[-0.28px] text-[#f2f4f7]">
                        {row.year}
                        {row.partial ? <span className="ml-1 text-[12px] text-[#6c737f]">{t("partial")}</span> : null}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3.5 text-[14px] leading-[23.1px] tracking-[-0.28px]",
                          pctClass(row.portfolio, "portfolio"),
                        )}
                      >
                        {row.portfolio == null ? "—" : formatSignedPct(row.portfolio)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3.5 text-[14px] leading-[23.1px] tracking-[-0.28px]",
                          pctClass(row.spy, "spy"),
                        )}
                      >
                        {row.spy == null ? "—" : formatSignedPct(row.spy)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              {t("contributionTitle")}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{t("contributionSubtitle")}</p>
          </header>
          <ul className="flex flex-col px-6">
            {CONTRIBUTION_KEYS.map((key, index) => (
              <li
                key={key}
                className={cn(
                  "flex items-center justify-between py-3",
                  index < CONTRIBUTION_KEYS.length - 1 && "border-b border-[#22262c]",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="size-2.5 shrink-0 rounded-[6px]" style={{ backgroundColor: CONTRIBUTION_COLORS[index] }} />
                  <span className="text-[14px] leading-[23.1px] text-[#99a1ac]">{t(key)}</span>
                </span>
                <span className="text-[14px] leading-[23.1px] tracking-[-0.28px] text-[#6c737f]">—</span>
              </li>
            ))}
          </ul>
          <p className="px-6 pt-4 pb-6 text-[12px] leading-[19.8px] text-[#6c737f]">
            {t("contributionUnavailable")}
          </p>
        </section>
      </div>
    </div>
  );
}
