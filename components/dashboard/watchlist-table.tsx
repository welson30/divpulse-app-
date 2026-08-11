"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { removeWatchlistItem } from "@/app/(dashboard)/watchlist/actions";
import { Sparkline } from "@/components/dashboard/sparkline";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { cn } from "@/lib/utils";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export type WatchlistItem = {
  id: string;
  ticker: string;
  name: string | null;
  price: number | null;
  yieldPct: number | null;
  nextExDate: string | null;
  sparkline: SparklinePoint[];
};

const COLS =
  "grid-cols-[minmax(10rem,1.6fr)_minmax(5rem,0.7fr)_minmax(5.5rem,0.8fr)_minmax(6rem,0.9fr)_minmax(7rem,0.9fr)_2.75rem]";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatYield(value: number | null) {
  if (value == null) return null;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatExDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function trendChange(points: SparklinePoint[]) {
  if (points.length < 2) return null;
  const first = points[0]!.c;
  const last = points[points.length - 1]!.c;
  if (first === 0) return last >= first ? 0 : -1;
  return ((last - first) / first) * 100;
}

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await removeWatchlistItem(id);
      } finally {
        setPendingId(null);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-12 text-center text-[13px] leading-[21.45px] text-[#99a1ac]">
        Nothing watched yet. Add a ticker you&rsquo;re considering — no need to own it first.
      </div>
    );
  }

  const countLabel = `${items.length} ${items.length === 1 ? "symbol" : "symbols"}`;

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
      <div className="border-b border-[#22262c] px-6 py-5">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          Watched tickers
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{countLabel}</p>
      </div>

      <div className="flex flex-col gap-px lg:hidden">
        {items.map((item) => (
          <WatchlistMobileRow
            key={item.id}
            item={item}
            pending={pendingId === item.id}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className={cn("grid min-w-[820px] border-b border-[#22262c]", COLS)}>
          {["Company", "Price", "Yield", "Next ex-date", "30-day trend", ""].map((label) => (
            <div
              key={label || "actions"}
              className="px-4 py-3 text-[11px] font-medium tracking-[1.54px] text-[#6c737f] uppercase first:px-6"
            >
              {label}
            </div>
          ))}
        </div>
        {items.map((item, index) => {
          const yieldLabel = formatYield(item.yieldPct);
          const tickerNode = isLinkableTicker(item.ticker) ? (
            <Link href={`/tickers/${item.ticker}`} className="hover:underline">
              {item.ticker}
            </Link>
          ) : (
            item.ticker
          );
          return (
            <div
              key={item.id}
              className={cn(
                "grid min-w-[820px] items-center",
                COLS,
                index < items.length - 1 && "border-b border-[#22262c]",
              )}
            >
              <div className="px-6 py-4">
                <p className="text-[14px] leading-[23.1px] font-medium text-[#f2f4f7]">{tickerNode}</p>
                <p className="truncate text-[12px] leading-[19.8px] text-[#6c737f]">{item.name ?? "—"}</p>
              </div>
              <div className="px-4 text-[14px] leading-[23.1px] tracking-[-0.28px] text-[#f2f4f7]">
                {formatMoney(item.price)}
              </div>
              <div className="px-4">
                {yieldLabel ? (
                  <span className="inline-flex rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-2 py-[4px] text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
                    {yieldLabel}
                  </span>
                ) : (
                  <span className="text-[14px] text-[#6c737f]">—</span>
                )}
              </div>
              <div className="px-4 text-[13px] leading-[21.45px] tracking-[-0.26px] text-[#99a1ac]">
                {formatExDate(item.nextExDate)}
              </div>
              <div className="px-4 py-3">
                <Sparkline
                  points={item.sparkline}
                  id={`wl-${item.id}`}
                  changePercent={trendChange(item.sparkline)}
                  width={112}
                  height={32}
                />
              </div>
              <div className="flex justify-end pr-4">
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Remove ${item.ticker}`}
                  className="flex size-8 items-center justify-center rounded-[10px] text-[#6c737f] transition-colors hover:bg-[#16191d] hover:text-[#f2f4f7] disabled:opacity-40"
                >
                  <FigmaIcon src="/marketing/dashboard/icon-trash-15.svg" className="size-[15px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WatchlistMobileRow({
  item,
  pending,
  onRemove,
}: {
  item: WatchlistItem;
  pending: boolean;
  onRemove: () => void;
}) {
  const yieldLabel = formatYield(item.yieldPct);
  const tickerNode = isLinkableTicker(item.ticker) ? (
    <Link href={`/tickers/${item.ticker}`} className="hover:underline">
      {item.ticker}
    </Link>
  ) : (
    item.ticker
  );

  return (
    <div className="flex items-start gap-3 border-b border-[#22262c] px-5 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#f2f4f7]">{tickerNode}</p>
        <p className="truncate text-[12px] text-[#6c737f]">{item.name ?? "—"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[#99a1ac]">
          <span className="text-[#f2f4f7]">{formatMoney(item.price)}</span>
          {yieldLabel ? (
            <span className="rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-2 py-[3px] text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
              {yieldLabel}
            </span>
          ) : null}
          <span>Ex {formatExDate(item.nextExDate)}</span>
        </div>
      </div>
      <Sparkline
        points={item.sparkline}
        id={`wl-m-${item.id}`}
        changePercent={trendChange(item.sparkline)}
        width={72}
        height={28}
      />
      <button
        type="button"
        disabled={pending}
        onClick={onRemove}
        aria-label={`Remove ${item.ticker}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[#6c737f] disabled:opacity-40"
      >
        <FigmaIcon src="/marketing/dashboard/icon-trash-15.svg" className="size-[15px]" />
      </button>
    </div>
  );
}
