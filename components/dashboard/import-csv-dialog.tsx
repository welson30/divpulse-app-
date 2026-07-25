"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { parseHoldingsCsv, type ParsedHoldingRow } from "@/lib/csv/parse-holdings";
import { importHoldingsFromCsv } from "@/app/(dashboard)/holdings/actions";

type ImportCsvDialogProps = {
  isProPlus: boolean;
};

export function ImportCsvDialog({ isProPlus }: ImportCsvDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedHoldingRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows([]);
    setSkipped(0);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    const text = await file.text();
    const result = parseHoldingsCsv(text);

    if (result.rows.length === 0) {
      setError("Couldn't find recognizable ticker/shares columns in this file. Expected headers like \"Ticker\" and \"Shares\".");
      setRows([]);
      setSkipped(result.skipped);
      return;
    }

    setRows(result.rows);
    setSkipped(result.skipped);
  }

  function confirmImport() {
    startTransition(async () => {
      setError(null);
      const result = await importHoldingsFromCsv(rows);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
    });
  }

  if (!isProPlus) {
    return (
      <Button variant="secondary" disabled className="h-10" title="CSV import is a Pro+ feature">
        Import CSV
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-10">
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import holdings from CSV</DialogTitle>
          <DialogDescription>
            Any CSV with ticker and shares columns works — we'll auto-detect common header names.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-sp-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm text-text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-xs file:font-medium file:text-text-primary"
          />

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          {rows.length > 0 ? (
            <>
              <div className="max-h-64 overflow-y-auto rounded-card border border-border-subtle">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="sticky top-0 bg-surface-2">
                      <th className="border-b border-border-subtle px-3 py-2 text-left font-mono text-[10px] font-medium tracking-[0.06em] text-text-secondary uppercase">
                        Ticker
                      </th>
                      <th className="border-b border-border-subtle px-3 py-2 text-right font-mono text-[10px] font-medium tracking-[0.06em] text-text-secondary uppercase">
                        Shares
                      </th>
                      <th className="border-b border-border-subtle px-3 py-2 text-left font-mono text-[10px] font-medium tracking-[0.06em] text-text-secondary uppercase">
                        Broker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={i === rows.length - 1 ? "" : "border-b border-border-subtle"}>
                        <td className="px-3 py-2 font-mono text-sm font-semibold text-text-primary">{row.ticker}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-text-primary">{row.shares}</td>
                        <td className="px-3 py-2 text-[13px] text-text-secondary">{row.brokerName ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-secondary">
                {rows.length} {rows.length === 1 ? "holding" : "holdings"} ready to import from {fileName}
                {skipped > 0 ? ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (missing ticker/shares)` : ""}
              </p>
              <Button type="button" disabled={isPending} onClick={confirmImport} className="h-10 self-start text-[13px]">
                {isPending ? "Importing…" : `Import ${rows.length} ${rows.length === 1 ? "holding" : "holdings"}`}
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
