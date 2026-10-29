"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AddHoldingForm } from "@/components/dashboard/add-holding-form";

export function AddHoldingDialog({
  defaultTicker,
  defaultCompanyName,
  defaultBroker,
  trigger,
}: {
  defaultTicker?: string;
  defaultCompanyName?: string;
  defaultBroker?: string;
  /** Custom trigger button — defaults to the plain "Add holding" button used on /holdings. */
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("dashboard.holdings");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button className="h-10">{t("dialogTrigger")}</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDesc")}</DialogDescription>
        </DialogHeader>
        <AddHoldingForm
          onSuccess={() => setOpen(false)}
          defaultTicker={defaultTicker}
          defaultCompanyName={defaultCompanyName}
          defaultBroker={defaultBroker}
        />
      </DialogContent>
    </Dialog>
  );
}
