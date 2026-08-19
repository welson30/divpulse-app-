import { cn } from "@/lib/utils";

export type MonthlyIncomePoint = { month: string; label: string; total: number };

/**
 * Twelve months of dividend income as a bar chart.
 *
 * Green throughout rather than red/green: every bar is money received, so
 * there is no negative case to encode — DESIGN.md reserves red for actual
 * losses, and tinting a low-income month red would be wrong. Months below
 * the average are dimmed instead, which conveys the same "quiet month"
 * signal honestly.
 *
 * Plain SVG for the same reason as the sparkline: a bar chart doesn't
 * justify a charting dependency, and this stays server-rendered.
 */
export function MonthlyIncomeChart({ data, className }: { data: MonthlyIncomePoint[]; className?: string }) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const avg = data.length > 0 ? data.reduce((s, d) => s + d.total, 0) / data.length : 0;

  // Returning null here would leave the surrounding card as a heading
  // above a void. Draw the axis and month labels anyway so the shape of
  // the chart is legible, and say plainly why it's empty.
  if (data.length === 0 || max <= 0) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="relative flex h-32 items-end gap-1.5">
          <div aria-hidden className="absolute inset-x-0 bottom-0 border-b border-dashed border-border-subtle" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-sm text-text-secondary">No dividends recorded yet</span>
            <span className="max-w-[260px] text-xs text-text-tertiary">
              Payouts appear here as your holdings pay them, usually within a day.
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {(data.length > 0 ? data : []).map((d) => (
            <div key={d.month} className="min-w-0 flex-1 truncate text-center font-mono text-[9px] text-text-tertiary">
              {d.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-32 items-end gap-1.5">
        {data.map((d) => {
          const heightPct = (d.total / max) * 100;
          const isStrong = d.total >= avg;
          return (
            // h-full is load-bearing — see passive-income-chart.tsx: the parent's
            // items-end leaves this column content-sized, and the bar's percentage
            // height can't resolve against an indefinite parent.
            <div key={d.month} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {/* Native title gives a usable hover readout without shipping
                  a tooltip library or making this a client component. */}
              <div
                className={cn(
                  "w-full rounded-t-[3px] transition-opacity",
                  isStrong ? "bg-green-500" : "bg-green-900",
                  "hover:opacity-80",
                )}
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={`${d.label}: $${d.total.toFixed(2)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {data.map((d) => (
          <div key={d.month} className="min-w-0 flex-1 truncate text-center font-mono text-[9px] text-text-secondary">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
