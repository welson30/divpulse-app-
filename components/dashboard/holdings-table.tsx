"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { RemoveHoldingDialog } from "@/components/dashboard/remove-holding-dialog";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { cn } from "@/lib/utils";
import type { SparklinePoint } from "@/lib/dividend-data/types";

export type Holding = {
  id: string;
  ticker: string;
  company_name: string | null;
  broker_name: string | null;
  shares: number;
  source: "manual" | "csv" | "plaid";
  name?: string | null;
  logoUrl?: string | null;
  price?: number | null;
  changePercent?: number | null;
  marketValue?: number | null;
  sparkline?: SparklinePoint[];
  annualIncome?: number | null;
  yieldPct?: number | null;
  weightPct?: number | null;
};

type SortKey = "ticker" | "value" | "yield" | "annual" | "weight";

const PAGE_SIZE = 12;
const TABLE_COLS =
  "grid-cols-[minmax(10rem,1.5fr)_minmax(12rem,1.4fr)_minmax(4.5rem,0.6fr)_minmax(5rem,0.7fr)_minmax(5.5rem,0.8fr)_minmax(4.5rem,0.6fr)_minmax(5rem,0.7fr)_minmax(6.5rem,0.9fr)_2.5rem]";

function formatMoney(value: number | null | undefined, compact = false) {
  if (value == null) return "—";
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShares(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function sortRows(rows: Holding[], key: SortKey, dir: "asc" | "desc") {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const num = (x: number | null | undefined, y: number | null | undefined) =>
      ((x ?? -Infinity) - (y ?? -Infinity)) * mul;
    if (key === "ticker") return a.ticker.localeCompare(b.ticker) * mul;
    if (key === "value") return num(a.marketValue, b.marketValue);
    if (key === "yield") return num(a.yieldPct, b.yieldPct);
    if (key === "annual") return num(a.annualIncome, b.annualIncome);
    return num(a.weightPct, b.weightPct);
  });
}

function SortLabel({
  label,
  column,
  active,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  active: boolean;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase",
        align === "right" && "ml-auto",
      )}
    >
      {label}
      <FigmaIcon
        src={active && dir === "desc" ? "/marketing/dashboard/icon-sort-desc.svg" : "/marketing/dashboard/icon-sort.svg"}
        className={cn("size-3", active ? "text-[#99a1ac]" : "text-[#6c737f]")}
      />
    </button>
  );
}

export function HoldingsTable({
  holdings,
  actions,
}: {
  holdings: Holding[];
  actions?: React.ReactNode;
}) {
  const [pendingRemoval, setPendingRemoval] = useState<Holding | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => sortRows(holdings, sortKey, sortDir), [holdings, sortKey, sortDir]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "ticker" ? "asc" : "desc");
    }
    setPage(0);
  }

  if (holdings.length === 0) {
    return (
      <section className="rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="flex items-center justify-between gap-4 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
          <div>
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Holdings
            </h2>
            <p className="mt-1 text-[13px] text-[#99a1ac]">0 positions</p>
          </div>
          {actions}
        </header>
        <p className="px-6 py-12 text-center text-sm text-[#99a1ac]">
          No holdings yet. Add a ticker to start tracking dividend income.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22262c] px-5 py-5 min-[900px]:px-6">
          <div>
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Holdings
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              {holdings.length} {holdings.length === 1 ? "position" : "positions"}
            </p>
          </div>
          {actions}
        </header>

        <div className="flex flex-col gap-2 p-4 lg:hidden">
          {visible.map((holding) => (
            <div key={holding.id} className="flex items-center gap-3 rounded-[10px] border border-[#22262c] bg-[#16191d] p-3">
              <div className="min-w-0 flex-1">
                {isLinkableTicker(holding.ticker) ? (
                  <Link href={`/tickers/${holding.ticker}`} className="text-[14px] font-medium text-[#f2f4f7]">
                    {holding.ticker}
                  </Link>
                ) : (
                  <div className="text-[14px] font-medium text-[#f2f4f7]">{holding.ticker}</div>
                )}
                <div className="truncate text-[12px] text-[#6c737f]">
                  {holding.name ?? holding.company_name ?? holding.broker_name ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] text-[#f2f4f7]">{formatMoney(holding.marketValue, true)}</div>
                <div className="text-[12px] text-[#3fbf87]">
                  {holding.yieldPct != null ? `${holding.yieldPct.toFixed(2)}%` : "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingRemoval(holding)}
                aria-label={`Remove ${holding.ticker}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6c737f] hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[880px]">
            <div className={`grid ${TABLE_COLS} border-b border-[#22262c] px-2`}>
              <div className="px-5 py-3">
                <SortLabel label="Ticker" column="ticker" active={sortKey === "ticker"} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="px-5 py-3 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">Broker</div>
              <div className="px-5 py-3 text-right text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">
                Shares
              </div>
              <div className="px-5 py-3 text-right text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase">
                Price
              </div>
              <div className="flex justify-end px-5 py-3">
                <SortLabel label="Value" column="value" active={sortKey === "value"} dir={sortDir} onSort={handleSort} align="right" />
              </div>
              <div className="flex justify-end px-5 py-3">
                <SortLabel label="Yield" column="yield" active={sortKey === "yield"} dir={sortDir} onSort={handleSort} align="right" />
              </div>
              <div className="flex justify-end px-5 py-3">
                <SortLabel label="Annual" column="annual" active={sortKey === "annual"} dir={sortDir} onSort={handleSort} align="right" />
              </div>
              <div className="flex justify-end px-5 py-3">
                <SortLabel label="Weight" column="weight" active={sortKey === "weight"} dir={sortDir} onSort={handleSort} align="right" />
              </div>
              <div />
            </div>

            {visible.map((holding) => {
              const name = holding.name ?? holding.company_name ?? holding.ticker;
              const tickerInner = (
                <>
                  <span className="block text-[14px] font-medium text-[#f2f4f7]">{holding.ticker}</span>
                  <span className="block truncate text-[12px] text-[#6c737f]">{name}</span>
                </>
              );
              return (
                <div
                  key={holding.id}
                  className={`grid ${TABLE_COLS} items-center border-b border-[#22262c] px-2 last:border-0 hover:bg-[#16191d]`}
                >
                  <div className="min-w-0 px-5 py-3.5">
                    {isLinkableTicker(holding.ticker) ? (
                      <Link href={`/tickers/${holding.ticker}`}>{tickerInner}</Link>
                    ) : (
                      <div>{tickerInner}</div>
                    )}
                  </div>
                  <div className="min-w-0 px-5 py-3.5">
                    <BrokerMark name={holding.broker_name} />
                  </div>
                  <div className="px-5 py-3.5 text-right text-[13px] tracking-[-0.26px] text-[#99a1ac]">
                    {formatShares(Number(holding.shares))}
                  </div>
                  <div className="px-5 py-3.5 text-right text-[13px] tracking-[-0.26px] text-[#99a1ac]">
                    {formatMoney(holding.price)}
                  </div>
                  <div className="px-5 py-3.5 text-right text-[14px] tracking-[-0.28px] text-[#f2f4f7]">
                    {formatMoney(holding.marketValue, true)}
                  </div>
                  <div className="px-5 py-3.5 text-right text-[13px] tracking-[-0.26px] text-[#3fbf87]">
                    {holding.yieldPct != null ? `${holding.yieldPct.toFixed(2)}%` : "—"}
                  </div>
                  <div className="px-5 py-3.5 text-right text-[13px] tracking-[-0.26px] text-[#99a1ac]">
                    {formatMoney(holding.annualIncome, true)}
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-3.5">
                    <div className="h-1.5 w-[48px] overflow-hidden rounded-full bg-[#16191d]">
                      <div
                        className="h-1.5 rounded-full bg-[#4c82f7]"
                        style={{ width: `${Math.min(100, Math.max(0, holding.weightPct ?? 0))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[12px] tracking-[-0.24px] text-[#6c737f]">
                      {holding.weightPct != null ? `${holding.weightPct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="pr-2">
                    <button
                      type="button"
                      onClick={() => setPendingRemoval(holding)}
                      aria-label={`Remove ${holding.ticker}`}
                      className="flex size-8 items-center justify-center rounded-[8px] text-[#6c737f] hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-[#22262c] px-5 py-4 min-[900px]:px-6">
            <p className="text-[13px] text-[#6c737f]">
              Page {safePage + 1} of {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex h-9 items-center rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[13.8px] text-[13px] font-medium text-[#f2f4f7] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="inline-flex h-9 items-center rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[13.8px] text-[13px] font-medium text-[#f2f4f7] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <RemoveHoldingDialog
        holdingId={pendingRemoval?.id ?? null}
        ticker={pendingRemoval?.ticker ?? ""}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      />
    </>
  );
}
