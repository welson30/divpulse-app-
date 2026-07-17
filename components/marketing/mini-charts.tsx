// Chart primitives matching DESIGN.md §6 Charts: green gradient fill for
// growth, grid lines at --border-subtle only, mono tabular data labels.
// Ported from the exact markup in Design-System/ui_kits/app/index.html.

export function DividendCalendarChart() {
  const bars = [
    { x: 10, y: 46, h: 44, tone: "high", month: "Jan" },
    { x: 50, y: 60, h: 30, tone: "low", month: "Feb" },
    { x: 90, y: 30, h: 60, tone: "high", month: "Mar" },
    { x: 130, y: 66, h: 24, tone: "low", month: "Apr" },
    { x: 170, y: 20, h: 70, tone: "high", month: "May" },
    { x: 210, y: 70, h: 20, tone: "low", month: "Jun" },
    { x: 250, y: 40, h: 50, tone: "high", month: "Jul" },
    { x: 290, y: 76, h: 14, tone: "low", month: "Aug" },
  ] as const;

  return (
    <svg viewBox="0 0 320 126" width="100%" height="126" role="img" aria-label="Monthly dividend income, January through August">
      <line x1="0" y1="20" x2="320" y2="20" stroke="var(--border-subtle)" strokeWidth={1} />
      <line x1="0" y1="55" x2="320" y2="55" stroke="var(--border-subtle)" strokeWidth={1} />
      <line x1="0" y1="90" x2="320" y2="90" stroke="var(--border-subtle)" strokeWidth={1} />
      {bars.map((b) => (
        <g key={b.x}>
          <rect
            x={b.x}
            y={b.y}
            width={20}
            height={b.h}
            rx={2}
            fill={b.tone === "high" ? "var(--green-500)" : "var(--green-900)"}
          />
          <text
            x={b.x + 10}
            y={104}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
            fontSize={9}
          >
            {b.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function DiversificationRing({ label, percent }: { label: string; percent: number }) {
  const circumference = 2 * Math.PI * 46;
  const dash = (percent / 100) * circumference;
  const gradientId = "paidprime-ring-gradient";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" width={120} height={120} role="img" aria-label={`Sector diversification, ${label} ${percent}%`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green-500)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--green-500)" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <circle cx={60} cy={60} r={46} fill="none" stroke="var(--border-subtle)" strokeWidth={14} />
        <circle
          cx={60}
          cy={60}
          r={46}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={14}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="font-mono text-xs text-text-secondary">
        {label} · {percent}%
      </div>
    </div>
  );
}
