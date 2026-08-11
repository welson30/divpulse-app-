import { cn } from "@/lib/utils";
import type { MonthlyIncomePoint } from "@/components/dashboard/monthly-income-chart";

function niceCeiling(max: number): number {
  if (max <= 0) return 100;
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

export function PassiveIncomeChart({
  data,
  className,
  title = "Passive income",
  subtitle = "Dividends received per month, trailing 12 months",
  chartClassName,
}: {
  data: MonthlyIncomePoint[];
  className?: string;
  title?: string;
  subtitle?: string;
  chartClassName?: string;
}) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const niceMax = niceCeiling(max);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, label: formatAxis(niceMax * p) }));

  return (
    <section className={cn("flex flex-col rounded-[14px] border border-[#22262c] bg-[#121417]", className)}>
      <header className="border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{subtitle}</p>
      </header>
      <div className="px-4 pb-5 pt-4 min-[900px]:px-6">
        {max <= 0 ? (
          <div
            className={cn(
              "flex h-[220px] items-center justify-center text-center text-[13px] text-[#99a1ac] min-[900px]:h-[260px]",
              chartClassName,
            )}
          >
            Payouts appear here as your holdings pay them.
          </div>
        ) : (
          <div className={cn("flex h-[220px] gap-2 min-[900px]:h-[260px]", chartClassName)}>
            <div className="flex w-9 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right font-[family-name:var(--font-outfit)] text-[11px] text-[#6c737f]">
              {ticks.map((t) => (
                <span key={t.p}>{t.label}</span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 items-end gap-1.5">
                {ticks.map((t) => (
                  <div
                    key={t.p}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-[#22262c]"
                    style={{ bottom: `${t.p * 100}%` }}
                  />
                ))}
                {data.map((d) => {
                  const heightPct = niceMax > 0 ? (d.total / niceMax) * 100 : 0;
                  return (
                    <div key={d.month} className="relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-end">
                      <div
                        className="w-full max-w-[28px] rounded-t-[3px] bg-[#3fbf87] hover:opacity-80"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                        title={`${d.label}: $${d.total.toFixed(2)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5">
                {data.map((d) => (
                  <div
                    key={d.month}
                    className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-outfit)] text-[11px] text-[#6c737f]"
                  >
                    {d.label}
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
