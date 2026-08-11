import { cn } from "@/lib/utils";

const BROKER_CHIPS: { match: string[]; src: string }[] = [
  { match: ["vanguard"], src: "/marketing/calendar/chip-vanguard.png" },
  { match: ["charlesschwab", "schwab"], src: "/marketing/calendar/chip-charles-schwab.png" },
  { match: ["fidelity"], src: "/marketing/calendar/chip-fidelity.png" },
  { match: ["etrade"], src: "/marketing/calendar/chip-etrade.png" },
  { match: ["robinhood"], src: "/marketing/calendar/chip-robinhood.png" },
  { match: ["wealthsimple"], src: "/marketing/calendar/chip-wealthsimple.png" },
  { match: ["questrade"], src: "/marketing/calendar/chip-questrade.png" },
  { match: ["degiro"], src: "/marketing/calendar/chip-degiro.png" },
  { match: ["tradier"], src: "/marketing/calendar/chip-tradier.png" },
  { match: ["tradestation"], src: "/marketing/calendar/chip-tradestation.png" },
  { match: ["alpaca"], src: "/marketing/calendar/chip-alpaca.png" },
  { match: ["webull"], src: "/marketing/calendar/chip-webull.png" },
];

function normalizeBroker(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function brokerChipSrc(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const key = normalizeBroker(name);
  const hit = BROKER_CHIPS.find((b) => b.match.some((m) => key.includes(m) || m.includes(key)));
  return hit?.src ?? null;
}

/** Figma Portfolio table: 60×20 rounded chip + broker name. */
export function BrokerMark({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const label = name?.trim() || null;
  if (!label) {
    return <span className={cn("text-[13px] text-[#99a1ac]", className)}>—</span>;
  }

  const src = brokerChipSrc(label);
  const initials = label.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "—";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local broker chip
        <img
          src={src}
          alt=""
          width={60}
          height={20}
          className="h-5 w-[60px] shrink-0 rounded-[5px] object-cover"
        />
      ) : (
        <span className="flex h-5 w-[60px] shrink-0 items-center justify-center rounded-[5px] bg-[#16191d] text-[9px] font-medium tracking-wide text-[#99a1ac]">
          {initials}
        </span>
      )}
      <span className="truncate text-[13px] text-[#99a1ac]">{label}</span>
    </span>
  );
}
