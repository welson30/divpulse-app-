// Multi-segment donut — unlike marketing/mini-charts.tsx's single-segment
// DiversificationRing demo (built for one hero stat, not a real
// breakdown), this renders every category as its own arc so the chart is
// honest about the full distribution, not just the largest slice.

const SEGMENT_COLORS = [
  "var(--green-500)",
  "var(--blue-info)",
  "var(--amber-warning)",
  "var(--green-300)",
  "var(--text-secondary)",
  "var(--red-500)",
];

export type DonutSegment = {
  label: string;
  value: number;
};

export function DiversificationDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((segment, i) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const dash = fraction * circumference;
    const arc = { ...segment, dash, offset, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length]!, percent: fraction * 100 };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-sp-3 sm:flex-row sm:items-start sm:gap-sp-4">
      <svg viewBox="0 0 120 120" width={140} height={140} role="img" aria-label="Portfolio diversification breakdown" className="shrink-0">
        <circle cx={60} cy={60} r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth={14} />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={60}
            cy={60}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={14}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
      <div className="flex w-full flex-col gap-1.5">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: arc.color }} />
              <span className="truncate text-text-primary">{arc.label}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">{arc.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
