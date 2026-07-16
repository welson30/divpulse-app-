import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-sp-2",
        align === "center" ? "mx-auto max-w-xl items-center text-center" : "max-w-xl items-start",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.08em] text-text-secondary uppercase">
        <span aria-hidden className="h-px w-4 bg-green-500/50" />
        {eyebrow}
      </span>
      {/* Marketing-scale display size — the app's 28px H1 reads like a page
          title, not a section statement, at 1180px width. */}
      <h2 className="text-balance font-display text-[clamp(26px,3.4vw,38px)] leading-[1.15] font-semibold tracking-[-0.01em] text-text-primary">
        {title}
      </h2>
      {description ? <p className="text-body text-text-secondary">{description}</p> : null}
    </Reveal>
  );
}
