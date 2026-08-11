/**
 * Figma 15:7208 ring: 132×132, center 66, radius 62, stroke 8, start at 12 o'clock.
 * Live dash offset — not the exported 75%/34% stills.
 */
export function RingGauge({
  percent,
  color,
  label,
}: {
  percent: number | null;
  color: string;
  label: string;
}) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const clamped = percent == null ? 0 : Math.min(100, Math.max(0, percent));
  const offset = c * (1 - clamped / 100);

  return (
    <div className="relative size-[132px] shrink-0">
      <svg width={132} height={132} viewBox="0 0 132 132" className="size-[132px] -rotate-90">
        <circle cx={66} cy={66} r={r} fill="none" stroke="#22262c" strokeWidth={8} />
        {percent != null ? (
          <circle
            cx={66}
            cy={66}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3px] px-2.5 text-center">
        <p className="text-[22px] leading-[22px] font-medium tracking-[-0.44px] text-[#f2f4f7]">
          {percent == null ? "—" : `${Math.round(percent)}%`}
        </p>
        <p className="text-[11px] leading-[18.15px] text-[#99a1ac]">{label}</p>
      </div>
    </div>
  );
}
