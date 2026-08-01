"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AddHoldingForm } from "@/components/dashboard/add-holding-form";

export function AddHoldingDialog({
  defaultTicker,
  defaultCompanyName,
  trigger,
}: {
  defaultTicker?: string;
  defaultCompanyName?: string;
  /** Custom trigger button — defaults to the plain "Add holding" button used on /holdings. */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button className="h-10">Add holding</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a holding</DialogTitle>
          <DialogDescription>Track a position manually — ticker, shares, and where it&apos;s held.</DialogDescription>
        </DialogHeader>
        <AddHoldingForm onSuccess={() => setOpen(false)} defaultTicker={defaultTicker} defaultCompanyName={defaultCompanyName} />
      </DialogContent>
    </Dialog>
  );
}
