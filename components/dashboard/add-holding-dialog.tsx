"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AddHoldingForm } from "@/components/dashboard/add-holding-form";

export function AddHoldingDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10">Add holding</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a holding</DialogTitle>
          <DialogDescription>Track a position manually — ticker, shares, and where it's held.</DialogDescription>
        </DialogHeader>
        <AddHoldingForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
