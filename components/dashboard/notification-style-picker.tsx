"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationPreviewCard } from "@/components/dashboard/notification-preview-card";
import { compactTemplate, descriptiveTemplate, brokerConfirmedTemplate, type NotificationStyle } from "@/lib/notifications/templates";
import { updateNotificationStyle, type SettingsActionState } from "@/app/(dashboard)/settings/actions";
import { cn } from "@/lib/utils";

// Illustrative only — "ABC" isn't a real ticker, so nobody mistakes this
// for their own holding. brokerConfirmedTemplate's own null-broker fallback
// ("your linked broker") does the rest, rather than naming a specific
// brokerage the user may not actually use.
const PREVIEW_TICKER = "ABC";
const PREVIEW_AMOUNT = 12.4;

const STYLES: {
  value: NotificationStyle;
  label: string;
  description: string;
  badge?: string;
}[] = [
  { value: "compact", label: "Compact", description: "Ticker and amount only — the shortest read." },
  { value: "descriptive", label: "Descriptive", description: "Confirms the money has landed, without naming a broker." },
  {
    value: "premium",
    label: "Premium",
    description: "Names your broker and shows a confirmed checkmark once a linked account verifies the payment.",
    badge: "Recommended",
  },
];

function previewFor(style: NotificationStyle) {
  if (style === "premium") return brokerConfirmedTemplate(PREVIEW_TICKER, PREVIEW_AMOUNT, null);
  if (style === "descriptive") return descriptiveTemplate(PREVIEW_TICKER, PREVIEW_AMOUNT);
  return compactTemplate(PREVIEW_TICKER, PREVIEW_AMOUNT);
}

export function NotificationStylePicker({ notificationStyle }: { notificationStyle: string }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateNotificationStyle, null);
  const [selected, setSelected] = useState<NotificationStyle>(
    notificationStyle === "descriptive" || notificationStyle === "premium" ? notificationStyle : "compact",
  );

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <input type="hidden" name="notificationStyle" value={selected} />

      <div className="flex flex-col gap-sp-2">
        {STYLES.map((style) => {
          const isSelected = selected === style.value;
          const content = previewFor(style.value);

          return (
            <button
              key={style.value}
              type="button"
              onClick={() => setSelected(style.value)}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-col gap-2 rounded-card border p-sp-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-3",
                isSelected ? "border-green-500 bg-[rgba(34,197,94,0.06)]" : "border-border-subtle bg-surface hover:border-border-interactive",
              )}
            >
              {/* Radio indicator — full-width rows read better with an
                  explicit selection mark than relying on the border
                  color alone. */}
              <span
                aria-hidden
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2 sm:order-1",
                  isSelected ? "border-green-500 bg-green-500" : "border-border-interactive",
                )}
              >
                {isSelected ? <span className="size-1.5 rounded-full bg-canvas" /> : null}
              </span>

              {/* The preview itself — full row width, so it actually reads
                  as a wide push-notification banner instead of a card
                  squeezed into a narrow grid column. */}
              <div className="min-w-0 flex-1 sm:order-2 sm:max-w-md">
                <NotificationPreviewCard title={content.push.title} body={content.push.body} />
              </div>

              <div className="min-w-0 sm:order-3 sm:w-56 sm:shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-primary">{style.label}</span>
                  {style.badge ? (
                    <span className="inline-flex items-center rounded-full bg-[rgba(34,197,94,0.12)] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] text-green-500 uppercase">
                      {style.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{style.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-500">Saved.</p> : null}

      <Button type="submit" disabled={pending} className="h-10 self-start px-5 text-[13px]">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
