"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IncomeGoalPanel, type IncomeGoalPanelProps } from "@/components/dashboard/goals/income-goal-panel";
import { ReserveGoalPanel, type ReserveGoalPanelProps } from "@/components/dashboard/goals/reserve-goal-panel";
import { FreedomGoalPanel, type FreedomGoalPanelProps } from "@/components/dashboard/goals/freedom-goal-panel";

const TABS = [
  { key: "income", label: "📈 Passive Income" },
  { key: "reserve", label: "🛡️ Emergency Reserve" },
  { key: "freedom", label: "🏝️ Financial Freedom" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export type GoalsTabsProps = {
  income: IncomeGoalPanelProps;
  reserve: ReserveGoalPanelProps;
  freedom: FreedomGoalPanelProps;
};

export function GoalsTabs({ income, reserve, freedom }: GoalsTabsProps) {
  const [active, setActive] = useState<TabKey>("income");

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors",
              active === tab.key
                ? "border-green-500/50 bg-[rgba(34,197,94,0.12)] text-green-500"
                : "border-border-subtle text-text-secondary hover:border-border-interactive",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "income" ? <IncomeGoalPanel {...income} /> : null}
      {active === "reserve" ? <ReserveGoalPanel {...reserve} /> : null}
      {active === "freedom" ? <FreedomGoalPanel {...freedom} /> : null}
    </div>
  );
}
