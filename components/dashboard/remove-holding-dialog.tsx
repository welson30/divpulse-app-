"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { deleteHolding } from "@/app/(dashboard)/holdings/actions";

type RemoveHoldingDialogProps = {
  holdingId: string | null;
  ticker: string;
  onOpenChange: (open: boolean) => void;
};

export function RemoveHoldingDialog({ holdingId, ticker, onOpenChange }: RemoveHoldingDialogProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={holdingId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {ticker}?</DialogTitle>
          <DialogDescription>
            This removes the position from your holdings. It doesn&rsquo;t affect your broker account — nothing here can move money.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-sp-2">
          <Button type="button" variant="secondary" className="h-10" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10"
            disabled={isPending}
            onClick={() => {
              if (!holdingId) return;
              startTransition(async () => {
                await deleteHolding(holdingId);
                onOpenChange(false);
              });
            }}
          >
            {isPending ? "Removing…" : "Remove holding"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
