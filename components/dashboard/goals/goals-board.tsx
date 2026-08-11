"use client";

import { useMemo, useState } from "react";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { RingGauge } from "@/components/dashboard/goals/ring-gauge";
import { GoalDialogs, type GoalEditor } from "@/components/dashboard/goals/goal-dialogs";
import { projectExpenseCoverage } from "@/lib/tickers/fi-projection";

export type GoalsBoardProps = {
  monthlyIncome: number;
  annualIncome: number;
  monthlyTarget: number | null;
  monthlyContribution: number | null;
  monthlyExpenses: number | null;
  reserveMonthsTarget: number | null;
  reserveCurrent: number | null;
  avgYieldPct: number;
};

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function fiBadge(yearsToFi: number | null): string | null {
  if (yearsToFi == null) return null;
  if (yearsToFi <= 0) return "FI reached";
  const years = Math.ceil(yearsToFi);
  return `FI in ~${years} year${years === 1 ? "" : "s"}`;
}

export function GoalsBoard({
  monthlyIncome,
  annualIncome,
  monthlyTarget,
  monthlyContribution,
  monthlyExpenses,
  reserveMonthsTarget,
  reserveCurrent,
  avgYieldPct,
}: GoalsBoardProps) {
  const [editor, setEditor] = useState<GoalEditor | null>(null);

  const monthlyPct =
    monthlyTarget != null && monthlyTarget > 0 ? (monthlyIncome / monthlyTarget) * 100 : null;
  const annualTarget = monthlyTarget != null ? monthlyTarget * 12 : null;
  const annualPct = annualTarget != null && annualTarget > 0 ? (annualIncome / annualTarget) * 100 : null;
  const fiPct =
    monthlyExpenses != null && monthlyExpenses > 0 ? (monthlyIncome / monthlyExpenses) * 100 : null;

  const path = useMemo(
    () =>
      projectExpenseCoverage({
        monthlyIncome,
        monthlyExpenses: monthlyExpenses ?? 0,
        avgYieldPct,
        monthlyContribution: monthlyContribution ?? 0,
      }),
    [monthlyIncome, monthlyExpenses, avgYieldPct, monthlyContribution],
  );

  const badge = fiBadge(path.yearsToFi);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-[#22262c] pb-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Planning</p>
          <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
            Financial goals
          </h1>
          <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
            Set targets for monthly income, annual income and financial independence, and track your trajectory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor("pick")}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[15px] text-[13px] font-medium text-[#f2f4f7] hover:border-[#4c82f7]"
        >
          <FigmaIcon src="/marketing/dashboard/icon-new-goal.svg" className="size-3.5 text-[#f2f4f7]" />
          New goal
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <GoalCard
          percent={monthlyPct}
          color="#3fbf87"
          label="Monthly income target"
          current={formatMoney(monthlyIncome)}
          target={monthlyTarget != null ? formatMoney(monthlyTarget) : "—"}
          onEdit={() => setEditor("income")}
        />
        <GoalCard
          percent={annualPct}
          color="#3fbf87"
          label="Annual income target"
          current={formatMoney(annualIncome)}
          target={annualTarget != null ? formatMoney(annualTarget) : "—"}
          onEdit={() => setEditor("annual")}
        />
        <GoalCard
          percent={fiPct}
          color="#4c82f7"
          label="Financial independence"
          current={fiPct == null ? "—" : `%${Math.round(fiPct)}`}
          target="%100"
          caption="of monthly expenses covered"
          onEdit={() => setEditor("fi")}
        />
      </div>

      <section className="flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="flex items-start justify-between gap-3 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Path to financial independence
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              Projected % of expenses covered by passive income
            </p>
          </div>
          {badge ? (
            <span className="mt-1 shrink-0 rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-2 py-[4px] text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
              {badge}
            </span>
          ) : null}
        </header>
        <div className="px-4 py-4 min-[900px]:px-6">
          <CoverageChart points={path.points} />
        </div>
      </section>

      <GoalDialogs
        editor={editor}
        onEditorChange={setEditor}
        monthlyTarget={monthlyTarget}
        monthlyContribution={monthlyContribution}
        monthlyExpenses={monthlyExpenses}
        reserveMonthsTarget={reserveMonthsTarget}
        reserveCurrent={reserveCurrent}
      />
    </div>
  );
}

function GoalCard({
  percent,
  color,
  label,
  current,
  target,
  caption,
  onEdit,
}: {
  percent: number | null;
  color: string;
  label: string;
  current: string;
  target: string;
  caption?: string;
  onEdit: () => void;
}) {
  return (
    <section className="flex flex-col items-center rounded-[14px] border border-[#22262c] bg-[#121417] px-6 pt-8 pb-6">
      <RingGauge percent={percent} color={color} label={label} />
      <p className="mt-5 text-[14px] leading-[23.1px] tracking-[-0.28px]">
        <span className="text-[#f2f4f7]">{current} </span>
        <span className="text-[#6c737f]">/ {target}</span>
      </p>
      {caption ? <p className="mt-1 text-[12px] leading-[19.8px] text-[#99a1ac]">{caption}</p> : null}
      <button
        type="button"
        onClick={onEdit}
        className="mt-4 inline-flex h-[33px] items-center gap-2 rounded-[10px] border border-[#2e343b] px-3 text-[12px] font-medium text-[#99a1ac] hover:text-[#f2f4f7]"
      >
        <FigmaIcon src="/marketing/dashboard/icon-edit-target.svg" className="size-3 text-[#99a1ac]" />
        Edit target
      </button>
    </section>
  );
}

function CoverageChart({ points }: { points: { label: string; coveragePct: number }[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center text-center text-[13px] text-[#99a1ac]">
        Set monthly expenses to project how much of them dividends could cover.
      </div>
    );
  }

  const rawMax = Math.max(...points.map((p) => p.coveragePct), 0);
  const niceMax = rawMax <= 120 ? 120 : Math.ceil(rawMax / 30) * 30;
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: `${Math.round(niceMax * p)}%` }));
  const xFor = (i: number) => (i / (points.length - 1)) * 100;
  const yFor = (v: number) => 100 - (Math.max(0, v) / niceMax) * 100;
  const line = points.map((d, i) => `${xFor(i)},${yFor(d.coveragePct)}`).join(" ");
  const fill = `0,100 ${line} 100,100`;

  return (
    <div className="flex h-[240px] gap-2">
      <div className="flex w-10 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right text-[11px] text-[#6c737f]">
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
            <polygon points={fill} fill="#3fbf87" fillOpacity={0.16} />
            <polyline
              points={line}
              fill="none"
              stroke="#3fbf87"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="mt-2 flex">
          {points.map((d) => (
            <div key={d.label} className="min-w-0 flex-1 truncate text-center text-[11px] text-[#6c737f]">
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
