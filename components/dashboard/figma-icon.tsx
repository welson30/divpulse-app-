import { cn } from "@/lib/utils";

type FigmaIconProps = {
  src: string;
  className?: string;
};

/**
 * Figma SVG as a CSS mask so `currentColor` (active blue / idle muted)
 * tints the glyph. Outer box is sized by className; the leaf fills that box.
 */
export function FigmaIcon({ src, className }: FigmaIconProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[17px] shrink-0 bg-current", className)}
      style={{
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

export function navIcon(src: string) {
  function Icon({ className }: { className?: string }) {
    return <FigmaIcon src={src} className={className} />;
  }
  return Icon;
}
