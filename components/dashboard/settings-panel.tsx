import { cn } from "@/lib/utils";

export function SettingsPanel({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]",
        className,
      )}
    >
      <header className="border-b border-[#22262c] px-6 py-5">
        <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{subtitle}</p>
      </header>
      <div className="p-6">{children}</div>
      {footer ? <div className="border-t border-[#22262c] px-6 py-6">{footer}</div> : null}
    </section>
  );
}

export const settingsInputClass =
  "h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] px-[17px] text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] focus:border-[#4c82f7] disabled:cursor-not-allowed disabled:opacity-60";

export const settingsLabelClass = "text-[14px] font-medium leading-[23.1px] text-[#f2f4f7]";

export const settingsPrimaryBtnClass =
  "inline-flex h-9 items-center justify-center rounded-[10px] bg-[#4c82f7] px-[15px] text-[13px] font-medium text-white hover:bg-[#3d6fe0] disabled:opacity-40";

export const settingsSecondaryBtnClass =
  "inline-flex h-9 items-center justify-center rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[15px] text-[13px] font-medium text-[#f2f4f7] hover:border-[#4c82f7] disabled:opacity-40";
