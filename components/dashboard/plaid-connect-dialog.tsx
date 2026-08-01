"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { PlaidConnectCard } from "@/components/dashboard/plaid-connect-card";

type PlaidConnection = {
  id: string;
  institution_name: string | null;
  status: "active" | "error" | "disconnected";
  last_synced_at: string | null;
};

type PlaidConnectDialogProps = {
  isProPlus: boolean;
  connections: PlaidConnection[];
};

/**
 * Surfaces the same broker auto-sync flow already on Settings' Integrations
 * tab directly from Holdings, next to Add holding / Import CSV — that's
 * where a user actually looks for ways to get holdings in, not Settings.
 * Reuses PlaidConnectCard as-is rather than duplicating the Plaid Link
 * wiring; only this call site's gating (disabled trigger pre-open) is new.
 */
export function PlaidConnectDialog({ isProPlus, connections }: PlaidConnectDialogProps) {
  if (!isProPlus) {
    return (
      <Button variant="secondary" disabled className="h-10" title="Broker auto-sync is a Pro+ feature">
        Auto-sync
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-10">
          Auto-sync
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a broker</DialogTitle>
          <DialogDescription>Sync holdings automatically from a US brokerage account via Plaid.</DialogDescription>
        </DialogHeader>
        <PlaidConnectCard isProPlus={isProPlus} connections={connections} />
      </DialogContent>
    </Dialog>
  );
}
