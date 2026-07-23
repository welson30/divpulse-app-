"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addWatchlistItem, type WatchlistActionState } from "@/app/(dashboard)/watchlist/actions";

export function AddWatchlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState<WatchlistActionState, FormData>(async (prevState, formData) => {
    const result = await addWatchlistItem(prevState, formData);
    if (!result) {
      onSuccess?.();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticker">Ticker</Label>
        <Input id="ticker" name="ticker" placeholder="JEPI" required maxLength={10} className="h-11 px-3.5 text-[15px] uppercase" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">
          Company name <span className="font-normal text-text-secondary">(optional)</span>
        </Label>
        <Input id="companyName" name="companyName" placeholder="JPMorgan Equity Premium Income ETF" className="h-11 px-3.5 text-[15px]" />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-11 text-[15px]">
        {pending ? "Adding…" : "Add to watchlist"}
      </Button>
    </form>
  );
}
