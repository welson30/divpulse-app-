// A plain notification-shaped row (icon + title + timestamp + body) in the
// app's own real, theme-aware surface tokens — not the dark iOS lock-screen
// glass from components/marketing/phone-mockup.tsx. That look only reads
// correctly inside a full phone frame with wallpaper around it; floating
// alone in a Settings card with nothing around it, the same dark glass is
// just an odd dark square, not a recognizable notification.

type NotificationPreviewCardProps = {
  title: string;
  body: string;
  time?: string;
  className?: string;
};

export function NotificationPreviewCard({ title, body, time = "now", className }: NotificationPreviewCardProps) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-2 px-2.5 py-2 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static local asset */}
      <img src="/logo.svg" alt="" width={18} height={18} className="mt-0.5 size-4.5 shrink-0 rounded-[5px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-semibold text-text-primary">{title}</span>
          <span className="shrink-0 font-mono text-[10px] text-text-tertiary">{time}</span>
        </div>
        <div className="mt-0.5 text-[11px] leading-snug whitespace-pre-line text-text-secondary">{body}</div>
      </div>
    </div>
  );
}
