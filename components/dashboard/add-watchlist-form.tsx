"use client";

import { useActionState, useState } from "react";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { TickerSearchCombobox } from "@/components/dashboard/ticker-search-combobox";
import { addWatchlistItem, type WatchlistActionState } from "@/app/(dashboard)/watchlist/actions";

export function AddWatchlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [state, formAction, pending] = useActionState<WatchlistActionState, FormData>(async (prevState, formData) => {
    const result = await addWatchlistItem(prevState, formData);
    if (!result) {
      setTicker("");
      setCompanyName("");
      onSuccess?.();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="companyName" value={companyName} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-[320px]">
          <TickerSearchCombobox
            id="ticker"
            name="ticker"
            value={ticker}
            onValueChange={setTicker}
            onSelect={(result) => setCompanyName(result.name)}
            placeholder="Add a ticker, e.g. AAPL"
            required
            className="h-[52px] rounded-[14px] border-[#2e343b] bg-[#0b0c0e] px-[17px] text-[16px] uppercase text-[#f2f4f7] placeholder:normal-case placeholder:text-[#6c737f] focus-visible:border-[#4c82f7] focus-visible:ring-0"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#4c82f7] px-[15px] text-[13px] font-medium text-white transition-colors hover:bg-[#3d72e8] disabled:opacity-50"
        >
          <FigmaIcon src="/marketing/dashboard/icon-plus-14.svg" className="size-3.5 text-white" />
          {pending ? "Adding…" : "Add to watchlist"}
        </button>
      </div>
      {state?.error ? (
        <p role="alert" className="text-[13px] text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
