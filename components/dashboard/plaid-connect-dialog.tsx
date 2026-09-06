"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { PlaidConnectCard } from "@/components/dashboard/plaid-connect-card";
import { usePlaidConnect } from "@/components/dashboard/use-plaid-connect";

type PlaidConnection = {
  id: string;
  institution_name: string | null;
  status: "active" | "error" | "disconnected";
  last_synced_at: string | null;
  needs_reauth: boolean;
};

type PlaidConnectDialogProps = {
  isProPlus: boolean;
  connections: PlaidConnection[];
};

/**
 * Surfaces the same broker auto-sync flow already on Settings' Integrations
 * tab directly from Holdings, next to Add holding / Import CSV — that's
 * where a user actually looks for ways to get holdings in, not Settings.
 *
 * usePlaidConnect is owned here, above the confirmation dialog, rather than
 * inside PlaidConnectCard. Plaid Link renders its own full-page overlay
 * directly on document.body, while a modal Radix Dialog disables pointer
 * events on the rest of the page and runs a focus trap for as long as it's
 * open. Opening Link from inside that dialog raced the two, and the dialog
 * killed Link's popup the instant it appeared — this only shows up here
 * because BrokersBoard (the dedicated /brokers page) calls usePlaidConnect
 * directly with no dialog in the way. Closing this dialog before starting
 * Link avoids the conflict: the hook lives one level up, so it keeps running
 * once the confirmation dialog unmounts.
 */
export function PlaidConnectDialog({ isProPlus, connections }: PlaidConnectDialogProps) {
  const { connect, reconnect, isPending, error } = usePlaidConnect();
  const [open, setOpen] = useState(false);

  if (!isProPlus) {
    return (
      <Button variant="secondary" disabled className="h-10" title="Broker auto-sync is a Pro+ feature">
        Auto-sync
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="h-10" disabled={isPending}>
            {isPending ? "Connecting…" : "Auto-sync"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a broker</DialogTitle>
            <DialogDescription>Sync holdings automatically from a US brokerage account via Plaid.</DialogDescription>
          </DialogHeader>
          <PlaidConnectCard
            isProPlus={isProPlus}
            connections={connections}
            isPending={isPending}
            error={error}
            connect={() => {
              setOpen(false);
              connect();
            }}
            reconnect={(connectionId) => {
              setOpen(false);
              reconnect(connectionId);
            }}
          />
        </DialogContent>
      </Dialog>
      {/* The confirmation dialog above closes the instant Link starts, so
          any failure lands after it's already gone — this is the only place
          left to show it. */}
      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
