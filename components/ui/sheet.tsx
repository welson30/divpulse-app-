"use client";

import * as React from "react";
import { Dialog as SheetPrimitiveImpl } from "radix-ui";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Root>) {
  return <SheetPrimitiveImpl.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Trigger>) {
  return <SheetPrimitiveImpl.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Portal>) {
  return <SheetPrimitiveImpl.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Close>) {
  return <SheetPrimitiveImpl.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Overlay>) {
  return (
    <SheetPrimitiveImpl.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:duration-200 data-[state=closed]:ease-in",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof SheetPrimitiveImpl.Content>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitiveImpl.Content
        data-slot="sheet-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-card border-t border-border-subtle bg-surface shadow-[0_-24px_64px_-32px_rgba(0,0,0,0.8)] data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:duration-200 data-[state=closed]:ease-in",
          className,
        )}
        {...props}
      >
        {/* Radix requires an accessible title on every Dialog.Content — this
            sheet has no visible heading in the design, so it's sr-only. */}
        <SheetPrimitiveImpl.Title className="sr-only">Menu</SheetPrimitiveImpl.Title>
        {/* Drag-handle affordance — purely decorative, the sheet has no actual drag-to-dismiss gesture. */}
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-subtle" />
        <div className="p-sp-4 pb-[calc(var(--spacing-sp-4)+env(safe-area-inset-bottom))]">{children}</div>
      </SheetPrimitiveImpl.Content>
    </SheetPortal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetOverlay, SheetPortal, SheetTrigger };
