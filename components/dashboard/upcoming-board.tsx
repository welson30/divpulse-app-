"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { cn } from "@/lib/utils";

export type UpcomingStatus = "confirmed" | "expected" | "pending";

export type UpcomingCard = {
  ticker: string;
  name: string;
  amount: number;
  exDate: string | null;
  payDate: string;
  broker: string | null;
  status: UpcomingStatus;
};

const FILTERS: { id: "all" | UpcomingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "expected", label: "Expected" },
  { id: "pending", label: "Pending" },
];

const BADGE: Record<UpcomingStatus, { label: string; className: string; icon: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
    icon: "/marketing/dashboard/icon-check-11.svg",
  },
  expected: {
    label: "Expected",
    className: "border-[rgba(76,130,247,0.3)] bg-[#16233d] text-[#4c82f7]",
    icon: "/marketing/dashboard/icon-expected-11.svg",
  },
  pending: {
    label: "Pending",
    className: "border-[rgba(224,164,92,0.3)] bg-[#241c10] text-[#e0a45c]",
    icon: "/marketing/dashboard/icon-pending-11.svg",
  },
};

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function UpcomingBoard({ cards }: { cards: UpcomingCard[] }) {
  const [filter, setFilter] = useState<"all" | UpcomingStatus>("all");
  const counts = useMemo(() => {
    const next = { all: cards.length, confirmed: 0, expected: 0, pending: 0 };
    for (const card of cards) next[card.status] += 1;
    return next;
  }, [cards]);

  const visible = filter === "all" ? cards : cards.filter((c) => c.status === filter);
  const total = visible.reduce((sum, c) => sum + c.amount, 0);
  const hasEstimate = visible.some((c) => c.status === "expected");
  const filterLabel = filter === "all" ? "all" : filter;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-[7px] text-[13px] font-medium",
                active
                  ? "border-[rgba(76,130,247,0.4)] bg-[#16233d] text-[#4c82f7]"
                  : "border-[#2e343b] bg-transparent text-[#99a1ac] hover:border-[#4c82f7]/40",
              )}
            >
              {tab.label}
              <span className="text-[11px] tracking-[-0.22px] text-[#6c737f]">{counts[tab.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-5">
        <div className="flex items-center gap-2 text-[13px] leading-[21.45px] text-[#99a1ac]">
          <FigmaIcon src="/marketing/dashboard/icon-cal-16.svg" className="size-4 text-[#99a1ac]" />
          {visible.length} {visible.length === 1 ? "payment" : "payments"} · {filterLabel}
        </div>
        <p className="text-[22px] font-medium leading-[36.3px] tracking-[-0.44px] text-[#f2f4f7]">
          {hasEstimate ? "~" : ""}
          {formatMoney(total)}
          <span className="ml-2 text-[12px] font-normal tracking-normal text-[#6c737f]">total expected</span>
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center text-sm text-[#99a1ac]">
          No {filter === "all" ? "" : `${filter} `}payments in the next 90 days.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
          {visible.map((card) => {
            const badge = BADGE[card.status];
            const title = (
              <>
                <span className="block text-[16px] font-semibold leading-[26.4px] text-[#f2f4f7]">{card.ticker}</span>
                <span className="block truncate text-[12px] leading-[19.8px] text-[#6c737f]">{card.name}</span>
              </>
            );
            return (
              <article
                key={`${card.ticker}-${card.payDate}-${card.status}`}
                className="flex flex-col gap-4 rounded-[14px] border border-[#22262c] bg-[#121417] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {isLinkableTicker(card.ticker) ? (
                      <Link href={`/tickers/${card.ticker}`} className="hover:opacity-80">
                        {title}
                      </Link>
                    ) : (
                      title
                    )}
                  </div>
                  <p className="shrink-0 text-[20px] tracking-[-0.4px] text-[#3fbf87]">
                    {card.status === "expected" ? "~" : ""}
                    {formatMoney(card.amount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[12px] tracking-[1.44px] text-[#6c737f] uppercase">Ex-date</p>
                    <p className="mt-0.5 text-[13px] leading-[21.45px] text-[#99a1ac]">
                      {card.exDate ? formatShortDate(card.exDate) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] tracking-[1.44px] text-[#6c737f] uppercase">Pay date</p>
                    <p className="mt-0.5 text-[13px] leading-[21.45px] text-[#99a1ac]">{formatShortDate(card.payDate)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[#22262c] pt-4">
                  <BrokerMark name={card.broker} />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-[3px] text-[11px] tracking-[1.1px] uppercase",
                      badge.className,
                    )}
                  >
                    <FigmaIcon src={badge.icon} className="size-[11px]" />
                    {badge.label}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
