"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AddWatchlistForm } from "@/components/dashboard/add-watchlist-form";

export function AddWatchlistDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10">Add to watchlist</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to watchlist</DialogTitle>
          <DialogDescription>Track a ticker you don&rsquo;t hold yet.</DialogDescription>
        </DialogHeader>
        <AddWatchlistForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
