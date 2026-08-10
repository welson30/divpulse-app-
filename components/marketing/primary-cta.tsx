"use client";

import Link from "next/link";
import {
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type SharedProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

type LinkProps = SharedProps & {
  href: string;
  type?: never;
};

type ButtonProps = SharedProps & {
  href?: never;
  type?: "button" | "submit";
};

/**
 * Primary marketing CTA — same hover language as pricing cards:
 * cursor spotlight + slight lift + intensified blue glow.
 */
export function PrimaryCta(props: LinkProps | ButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  const className = cn(
    "group relative inline-flex items-center justify-center overflow-hidden",
    "bg-[#4c82f7] font-semibold text-white",
    "shadow-[0px_16px_40px_-16px_#4c82f7]",
    "transition-[transform,box-shadow,filter] duration-300 ease-out will-change-transform",
    "hover:-translate-y-1 hover:brightness-110",
    "hover:shadow-[0_0_0_1px_rgba(76,130,247,0.45),0_24px_56px_-14px_rgba(76,130,247,0.7)]",
    "motion-reduce:hover:translate-y-0",
    props.className,
  );

  const style = {
    "--spot-x": "50%",
    "--spot-y": "40%",
    ...props.style,
  } as CSSProperties;

  const body = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(140px circle at var(--spot-x) var(--spot-y), rgba(255,255,255,0.32), transparent 55%)",
        }}
      />
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2",
          props.contentClassName,
        )}
      >
        {props.children}
      </span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link
        ref={ref}
        href={props.href}
        onClick={props.onClick}
        onMouseMove={onMove}
        className={className}
        style={style}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      onClick={props.onClick}
      onMouseMove={onMove}
      className={className}
      style={style}
    >
      {body}
    </button>
  );
}
