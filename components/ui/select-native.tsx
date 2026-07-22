import * as React from "react";

import { cn } from "@/lib/utils";

// Native <select>, not a Radix Select — matches Input's visual language
// with far less surface area for a handful of static options
// (currency/locale in the settings form). Reach for a real Radix Select
// if a future use case needs custom option rendering.
function SelectNative({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "h-11 w-full rounded-control border border-border-interactive bg-surface px-3.5 text-[15px] text-text-primary transition-colors outline-none",
        "focus-visible:border-green-500",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { SelectNative };
