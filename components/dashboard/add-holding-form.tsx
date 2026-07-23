"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHolding, type HoldingActionState } from "@/app/(dashboard)/holdings/actions";

export function AddHoldingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState<HoldingActionState, FormData>(async (prevState, formData) => {
    const result = await addHolding(prevState, formData);
    if (!result) {
      onSuccess?.();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="grid grid-cols-2 gap-sp-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ticker">Ticker</Label>
          <Input id="ticker" name="ticker" placeholder="KO" required maxLength={10} className="h-11 px-3.5 text-[15px] uppercase" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shares">Shares</Label>
          <Input id="shares" name="shares" type="number" step="any" min="0" placeholder="10" required className="h-11 px-3.5 text-[15px]" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">
          Company name <span className="font-normal text-text-secondary">(optional)</span>
        </Label>
        <Input id="companyName" name="companyName" placeholder="The Coca-Cola Company" className="h-11 px-3.5 text-[15px]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brokerName">
          Broker <span className="font-normal text-text-secondary">(optional)</span>
        </Label>
        <Input id="brokerName" name="brokerName" placeholder="Fidelity" className="h-11 px-3.5 text-[15px]" />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-11 text-[15px]">
        {pending ? "Adding…" : "Add holding"}
      </Button>
    </form>
  );
}
