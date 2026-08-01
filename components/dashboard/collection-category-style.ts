import { Briefcase, Building2, Coins, Cpu, Layers, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; chipClass: string }> = {
  "Real Estate": { icon: Building2, chipClass: "bg-[rgba(34,197,94,0.12)] text-green-500" },
  Income: { icon: Coins, chipClass: "bg-warning/12 text-warning" },
  "Business Development": { icon: Briefcase, chipClass: "bg-blue-500/12 text-blue-500" },
  "Dividend Growth": { icon: TrendingUp, chipClass: "bg-[rgba(34,197,94,0.12)] text-green-500" },
  Utilities: { icon: Zap, chipClass: "bg-warning/12 text-warning" },
  Technology: { icon: Cpu, chipClass: "bg-blue-500/12 text-blue-500" },
};
const DEFAULT_CATEGORY_STYLE = { icon: Layers, chipClass: "bg-surface-2 text-text-secondary" };

/** Icon + tint per collection `category` — shared by the Collections list and detail pages so a category reads the same badge everywhere. Unmapped categories (any future admin-added one) fall back to a neutral chip rather than erroring. */
export function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;
}
