"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconGrowth, IconShield, IconPalmTree } from "@/components/marketing/icons";
import { AiAdvisorPanel } from "@/components/dashboard/ai-advisor-panel";
import { IncomeGoalPanel, type IncomeGoalPanelProps } from "@/components/dashboard/goals/income-goal-panel";
import { ReserveGoalPanel, type ReserveGoalPanelProps } from "@/components/dashboard/goals/reserve-goal-panel";
import { FreedomGoalPanel, type FreedomGoalPanelProps } from "@/components/dashboard/goals/freedom-goal-panel";

const TABS = [
  { key: "income", label: "Passive Income", Icon: IconGrowth },
  { key: "reserve", label: "Emergency Reserve", Icon: IconShield },
  { key: "freedom", label: "Financial Freedom", Icon: IconPalmTree },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export type GoalsTabsProps = {
  isPro: boolean;
  income: Omit<IncomeGoalPanelProps, "isPro"> & { placeholder: string };
  reserve: Omit<ReserveGoalPanelProps, "isPro"> & { placeholder: string };
  freedom: Omit<FreedomGoalPanelProps, "isPro"> & { placeholder: string };
};

export function GoalsTabs({ isPro, income, reserve, freedom }: GoalsTabsProps) {
  const [active, setActive] = useState<TabKey>("income");

  const placeholder = active === "income" ? income.placeholder : active === "reserve" ? reserve.placeholder : freedom.placeholder;

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="inline-flex gap-1 self-start rounded-full border border-border-subtle bg-surface-2 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 font-sans text-xs font-semibold whitespace-nowrap transition-colors",
              active === tab.key
                ? "bg-green-500 text-canvas shadow-[0_1px_0_rgba(0,0,0,0.1)]"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <tab.Icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {active === "income" ? <IncomeGoalPanel {...income} isPro={isPro} /> : null}
      {active === "reserve" ? <ReserveGoalPanel {...reserve} isPro={isPro} /> : null}
      {active === "freedom" ? <FreedomGoalPanel {...freedom} isPro={isPro} /> : null}

      <AiAdvisorPanel isPro={isPro} placeholder={placeholder} />
    </div>
  );
}
