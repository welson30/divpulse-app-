import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconGrowth, IconShield, IconPalmTree } from "@/components/marketing/icons";
import { AiAdvisorPanel } from "@/components/dashboard/ai-advisor-panel";
import { IncomeGoalPanel, type IncomeGoalPanelProps } from "@/components/dashboard/goals/income-goal-panel";
import { ReserveGoalPanel, type ReserveGoalPanelProps } from "@/components/dashboard/goals/reserve-goal-panel";
import { FreedomGoalPanel, type FreedomGoalPanelProps } from "@/components/dashboard/goals/freedom-goal-panel";

export const GOAL_TABS = [
  { key: "income", label: "Passive Income", Icon: IconGrowth },
  { key: "reserve", label: "Emergency Reserve", Icon: IconShield },
  { key: "freedom", label: "Financial Freedom", Icon: IconPalmTree },
] as const;

export type GoalTabKey = (typeof GOAL_TABS)[number]["key"];

export type GoalsTabsProps = {
  isPro: boolean;
  active: GoalTabKey;
  income: Omit<IncomeGoalPanelProps, "isPro"> & { placeholder: string };
  reserve: Omit<ReserveGoalPanelProps, "isPro"> & { placeholder: string };
  freedom: Omit<FreedomGoalPanelProps, "isPro"> & { placeholder: string };
};

/**
 * URL-driven (not local useState) so a goal tab is bookmarkable/shareable
 * and survives a refresh — matches the pattern already established on
 * Settings, Collections and Calendar rather than resetting to "income"
 * every time, which is what a client-state tab would do here since this
 * is a Server Component page underneath.
 */
export function GoalsTabs({ isPro, active, income, reserve, freedom }: GoalsTabsProps) {
  const placeholder = active === "income" ? income.placeholder : active === "reserve" ? reserve.placeholder : freedom.placeholder;

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex gap-1 overflow-x-auto rounded-full border border-border-subtle bg-surface-2 p-1">
        {GOAL_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/goals?tab=${tab.key}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-sans text-xs font-semibold whitespace-nowrap transition-colors",
              active === tab.key
                ? "bg-green-500 text-canvas shadow-[0_1px_0_rgba(0,0,0,0.1)]"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <tab.Icon className="size-3.5" />
            {tab.label}
          </Link>
        ))}
      </div>

      {active === "income" ? <IncomeGoalPanel {...income} isPro={isPro} /> : null}
      {active === "reserve" ? <ReserveGoalPanel {...reserve} isPro={isPro} /> : null}
      {active === "freedom" ? <FreedomGoalPanel {...freedom} isPro={isPro} /> : null}

      <AiAdvisorPanel isPro={isPro} placeholder={placeholder} />
    </div>
  );
}
