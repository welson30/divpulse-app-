"use client";

import { FigmaIcon } from "@/components/dashboard/figma-icon";
import type { Holding } from "@/components/dashboard/holdings-table";

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function ExportHoldingsButton({ holdings }: { holdings: Holding[] }) {
  function exportCsv() {
    const header = ["Ticker", "Name", "Broker", "Shares", "Price", "Value", "Yield %", "Annual", "Weight %"];
    const lines = holdings.map((h) =>
      [
        h.ticker,
        h.name ?? h.company_name ?? "",
        h.broker_name ?? "",
        h.shares,
        h.price ?? "",
        h.marketValue ?? "",
        h.yieldPct != null ? h.yieldPct.toFixed(2) : "",
        h.annualIncome ?? "",
        h.weightPct != null ? h.weightPct.toFixed(2) : "",
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paidprime-portfolio.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={holdings.length === 0}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[13.8px] text-[13px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7]/40 disabled:opacity-40"
    >
      <FigmaIcon src="/marketing/dashboard/icon-export.svg" className="size-[14px]" />
      Export
    </button>
  );
}
