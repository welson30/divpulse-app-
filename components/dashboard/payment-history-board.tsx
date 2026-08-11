"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BrokerMark } from "@/components/dashboard/broker-mark";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { cn } from "@/lib/utils";

export type HistoryRow = {
  id: string;
  ticker: string;
  name: string;
  broker: string | null;
  payDate: string;
  amount: number;
};

const PAGE_SIZE = 8;
const COLS =
  "grid-cols-[minmax(10rem,1.4fr)_minmax(11rem,1.2fr)_minmax(7.5rem,0.8fr)_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)]";

function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 100) {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPayDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function PaymentHistoryBoard({ rows }: { rows: HistoryRow[] }) {
  const years = useMemo(() => {
    const set = new Set(rows.map((r) => r.payDate.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows]);
  const brokers = useMemo(() => {
    const set = new Set(rows.map((r) => r.broker?.trim() || "Unspecified"));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const [year, setYear] = useState("all");
  const [broker, setBroker] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (year !== "all" && r.payDate.slice(0, 4) !== year) return false;
      const name = r.broker?.trim() || "Unspecified";
      if (broker !== "all" && name !== broker) return false;
      return true;
    });
  }, [rows, year, broker]);

  const withRunning = useMemo(() => {
    let running = 0;
    const oldestFirst = [...filtered].sort((a, b) => a.payDate.localeCompare(b.payDate) || a.id.localeCompare(b.id));
    const byId = new Map<string, number>();
    for (const row of oldestFirst) {
      running += row.amount;
      byId.set(row.id, running);
    }
    return filtered.map((row) => ({ ...row, running: byId.get(row.id) ?? 0 }));
  }, [filtered]);

  const total = filtered.reduce((sum, r) => sum + r.amount, 0);
  const pageCount = Math.max(1, Math.ceil(withRunning.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = withRunning.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const yearly = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const name = row.broker?.trim() || "Unspecified";
      if (broker !== "all" && name !== broker) continue;
      const y = row.payDate.slice(0, 4);
      map.set(y, (map.get(y) ?? 0) + row.amount);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows, broker]);

  function exportCsv() {
    const header = ["Ticker", "Name", "Broker", "Pay date", "Amount", "Running"];
    const lines = withRunning.map((r) =>
      [r.ticker, r.name, r.broker ?? "", r.payDate, r.amount.toFixed(2), r.running.toFixed(2)].map(csvCell).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paidprime-payment-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-[#22262c] pb-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">History</p>
          <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
            Payment history
          </h1>
          <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
            Full record of confirmed dividend deposits across every connected broker.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[13.8px] text-[13px] font-medium text-[#f2f4f7] hover:border-[#4c82f7]/40 disabled:opacity-40"
        >
          <FigmaIcon src="/marketing/dashboard/icon-export.svg" className="size-[14px]" />
          Export CSV
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-[10px] border border-[#22262c] bg-[#0b0c0e] p-[4.8px]">
          <button
            type="button"
            onClick={() => {
              setYear("all");
              setPage(0);
            }}
            className={cn(
              "rounded-[8px] px-3 py-1.5 text-[11px] tracking-[1.1px] uppercase",
              year === "all" ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#6c737f] hover:text-[#f2f4f7]",
            )}
          >
            All
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(y);
                setPage(0);
              }}
              className={cn(
                "rounded-[8px] px-3 py-1.5 text-[11px] tracking-[1.1px] uppercase",
                year === y ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#6c737f] hover:text-[#f2f4f7]",
              )}
            >
              {y}
            </button>
          ))}
        </div>
        <label className="relative">
          <span className="sr-only">Filter by broker</span>
          <select
            value={broker}
            onChange={(e) => {
              setBroker(e.target.value);
              setPage(0);
            }}
            className="h-9 appearance-none rounded-[10px] border border-[#2e343b] bg-[#0b0c0e] py-px pl-[16.8px] pr-9 text-[13px] text-[#f2f4f7] outline-none"
          >
            <option value="all">All brokers</option>
            {brokers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <FigmaIcon
            src="/marketing/dashboard/icon-chevron.svg"
            className="pointer-events-none absolute top-1/2 right-3 size-[14px] -translate-y-1/2 text-[#6c737f]"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_280px]">
        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Payments
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              {filtered.length} {filtered.length === 1 ? "record" : "records"} · {formatMoney(total)} total
            </p>
          </header>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div
                className={`grid ${COLS} border-b border-[#22262c] px-6 py-3 text-[11px] font-bold tracking-[1.54px] text-[#6c737f] uppercase`}
              >
                <span>Holding</span>
                <span>Broker</span>
                <span>Pay date</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Running</span>
              </div>
              {pageRows.length === 0 ? (
                <p className="px-6 py-10 text-center text-[13px] text-[#99a1ac]">No payments in this filter.</p>
              ) : (
                pageRows.map((row, i) => {
                  const holding = (
                    <>
                      <span className="block text-[14px] font-medium leading-[23.1px] text-[#f2f4f7]">{row.ticker}</span>
                      <span className="block truncate text-[12px] leading-[19.8px] text-[#6c737f]">{row.name}</span>
                    </>
                  );
                  return (
                    <div
                      key={row.id}
                      className={`grid ${COLS} items-center px-6 py-3.5 ${i < pageRows.length - 1 ? "border-b border-[#22262c]" : ""}`}
                    >
                      {isLinkableTicker(row.ticker) ? (
                        <Link href={`/tickers/${row.ticker}`} className="min-w-0 pr-4 hover:opacity-80">
                          {holding}
                        </Link>
                      ) : (
                        <div className="min-w-0 pr-4">{holding}</div>
                      )}
                      <div className="pr-4">
                        <BrokerMark name={row.broker} />
                      </div>
                      <span className="text-[13px] text-[#99a1ac]">{formatPayDate(row.payDate)}</span>
                      <span className="text-right text-[14px] tracking-[-0.28px] text-[#3fbf87]">
                        +{formatMoney(row.amount)}
                      </span>
                      <span className="text-right text-[13px] tracking-[-0.26px] text-[#99a1ac]">
                        {formatMoney(row.running)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-[#22262c] px-6 py-4">
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

        <aside>
          <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Yearly totals
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Confirmed dividend income</p>
            </header>
            <div className="px-6 py-2">
              {yearly.length === 0 ? (
                <p className="py-4 text-[13px] text-[#99a1ac]">No yearly totals yet.</p>
              ) : (
                yearly.map(([y, amount], i) => (
                  <div
                    key={y}
                    className={`flex items-center justify-between py-3.5 ${i < yearly.length - 1 ? "border-b border-[#22262c]" : ""}`}
                  >
                    <span className="text-[13px] leading-[21.45px] text-[#99a1ac]">{y}</span>
                    <span className="text-[14px] tracking-[-0.28px] text-[#f2f4f7]">{formatMoney(amount, true)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
