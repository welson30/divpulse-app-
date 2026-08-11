"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import {
  disablePushAlerts,
  disconnectTelegram,
  getTelegramLinkUrl,
  setNotificationStyle,
} from "@/app/(dashboard)/settings/actions";
import { savePushToken } from "@/app/(dashboard)/notifications/actions";
import { requestPushToken } from "@/lib/firebase/client";
import { type NotificationStyle } from "@/lib/notifications/templates";
import { cn } from "@/lib/utils";

export type TemplatePreview = {
  ticker: string;
  amount: number;
  broker: string | null;
  fromLivePayment: boolean;
};

type TemplateCard = {
  value: NotificationStyle;
  label: string;
  recommended?: boolean;
  title: string;
  amount: string;
  extra: string[];
};

function formatMoney(value: number) {
  return `+$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function cardsFor(preview: TemplatePreview): TemplateCard[] {
  const amount = formatMoney(preview.amount);
  const broker = preview.broker?.trim() || "your linked broker";
  return [
    {
      value: "compact",
      label: "Privacy mode",
      recommended: true,
      title: "Dividend received",
      amount,
      extra: [preview.ticker],
    },
    {
      value: "descriptive",
      label: "Standard",
      title: `Dividend received · ${preview.ticker}`,
      amount,
      extra: ["Now in your account"],
    },
    {
      value: "premium",
      label: "Detailed",
      title: `Dividend confirmed · ${preview.ticker}`,
      amount,
      extra: [`Paid by ${broker}`, "Confirmed only after a linked broker verifies the deposit"],
    },
  ];
}

export function AlertTemplatesBoard({
  notificationStyle,
  preview,
  pushEnabled,
  telegramConnected,
  isPro,
}: {
  notificationStyle: NotificationStyle;
  preview: TemplatePreview;
  pushEnabled: boolean;
  telegramConnected: boolean;
  isPro: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<NotificationStyle>(notificationStyle);
  const [pushOn, setPushOn] = useState(pushEnabled);
  const [telegramOn, setTelegramOn] = useState(telegramConnected);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const templates = cardsFor(preview);

  function pickStyle(value: NotificationStyle) {
    if (value === selected || pending) return;
    const previous = selected;
    setSelected(value);
    setError(null);
    startTransition(async () => {
      const result = await setNotificationStyle(value);
      if (result && "error" in result) {
        setSelected(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function togglePush() {
    if (pending) return;
    setError(null);
    if (pushOn) {
      setPushOn(false);
      startTransition(async () => {
        const result = await disablePushAlerts();
        if (result?.error) {
          setPushOn(true);
          setError(result.error);
          return;
        }
        router.refresh();
      });
      return;
    }
    startTransition(async () => {
      const token = await requestPushToken();
      if (!token) {
        setError("Couldn't enable push on this device. Check the browser permission and try again.");
        return;
      }
      const result = await savePushToken(token, navigator.userAgent);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setPushOn(true);
      router.refresh();
    });
  }

  function toggleTelegram() {
    if (pending) return;
    setError(null);
    if (!isPro) {
      setError("Telegram alerts are a Pro feature.");
      return;
    }
    if (telegramOn) {
      setTelegramOn(false);
      startTransition(async () => {
        await disconnectTelegram();
        router.refresh();
      });
      return;
    }
    startTransition(async () => {
      const result = await getTelegramLinkUrl();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Alerts</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Notification templates
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          Control exactly how much detail appears in your dividend alerts across every channel.
        </p>
      </header>

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <div className="border-b border-[#22262c] px-6 py-5">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            Choose a template
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
            {preview.fromLivePayment
              ? `Preview uses your most recent dividend (${preview.ticker}).`
              : "Illustrative preview — not a holding of yours."}
          </p>
        </div>
        <div className="grid gap-4 p-6 min-[1100px]:grid-cols-3">
          {templates.map((card) => {
            const active = selected === card.value;
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => pickStyle(card.value)}
                disabled={pending}
                className="flex flex-col gap-3 py-4 text-left disabled:opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#f2f4f7]">{card.label}</span>
                  {card.recommended ? (
                    <span className="rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-2 py-[4px] text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "rounded-[18px] border p-[17px]",
                    active ? "border-[rgba(76,130,247,0.5)] bg-[#16233d]" : "border-[#2e343b] bg-[#0b0c0e]",
                  )}
                >
                  <div className="rounded-[14px] border border-[#22262c] bg-[#16191d] p-[15px] shadow-[0px_2px_5px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-[6px] bg-[#4c82f7] text-[10px] font-bold text-white">
                        P
                      </span>
                      <span className="text-[11px] font-medium text-[#99a1ac]">PaidPrime</span>
                      <span className="ml-auto text-[10px] text-[#6c737f]">now</span>
                    </div>
                    <p className="mt-[7px] text-[13px] leading-[21.45px] font-medium text-[#f2f4f7]">{card.title}</p>
                    <p className="text-[16px] leading-[26.4px] font-semibold tracking-[-0.32px] text-[#3fbf87]">
                      {card.amount}
                    </p>
                    {card.extra.map((line) => (
                      <p key={line} className="text-[11px] leading-[18.15px] text-[#6c737f]">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <span className="flex items-center gap-2 text-[12px] leading-[19.8px] text-[#99a1ac]">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      active ? "border-[#4c82f7] bg-[#4c82f7]" : "border-[#2e343b]",
                    )}
                  >
                    {active ? <FigmaIcon src="/marketing/dashboard/icon-radio-check.svg" className="size-[11px] text-white" /> : null}
                  </span>
                  {active ? "Selected" : "Select"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <div className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Channels
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Choose where alerts are delivered</p>
          </div>
          <ChannelRow
            label="Push notifications"
            icon="/marketing/dashboard/icon-channel-push-16.svg"
            on={pushOn}
            onToggle={togglePush}
            disabled={pending}
          />
          <ChannelRow
            label="Telegram bot"
            icon="/marketing/dashboard/icon-channel-telegram-16.svg"
            on={telegramOn}
            onToggle={toggleTelegram}
            disabled={pending}
            hint={!isPro ? "Pro" : telegramOn ? undefined : "Opens Telegram to connect"}
          />
          <ChannelRow
            label="Email digest"
            icon="/marketing/dashboard/icon-channel-email-16.svg"
            on={false}
            disabled
            hint="Not available"
          />
        </section>

        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <div className="border-b border-[#22262c] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#16191d] text-[#99a1ac]">
                <FigmaIcon src="/marketing/dashboard/icon-quiet-settings.svg" className="size-3.5" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                  Quiet hours & thresholds
                </h2>
                <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
                  Fine-tune when and what triggers an alert
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 p-6">
            <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
              Quiet hours and a minimum amount aren&rsquo;t stored yet — alerts send as soon as a dividend is detected.
            </p>
            <div className="grid gap-4 min-[520px]:grid-cols-2">
              <DisabledField label="Quiet hours start" />
              <DisabledField label="Quiet hours end" />
            </div>
            <DisabledField label="Minimum payment threshold" hint="Only notify above this amount" />
          </div>
        </section>
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChannelRow({
  label,
  icon,
  on,
  onToggle,
  disabled,
  hint,
}: {
  label: string;
  icon: string;
  on: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#22262c] px-6 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <FigmaIcon src={icon} className="size-4 text-[#99a1ac]" />
        <div className="min-w-0">
          <p className="text-[14px] leading-[23.1px] text-[#f2f4f7]">{label}</p>
          {hint ? <p className="text-[12px] leading-[19.8px] text-[#6c737f]">{hint}</p> : null}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled || !onToggle}
        onClick={onToggle}
        className={cn(
          "flex h-6 w-[45px] shrink-0 items-center rounded-full border p-[3px] transition-colors",
          on ? "justify-end border-[#4c82f7] bg-[#4c82f7]" : "justify-start border-[#2e343b] bg-[#16191d]",
          (!onToggle || disabled) && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="size-[18px] rounded-full bg-white" />
      </button>
    </div>
  );
}

function DisabledField({ label, hint }: { label: string; hint?: string }) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-medium text-[#f2f4f7]">{label}</span>
        {hint ? <span className="text-[13px] text-[#6c737f]">{hint}</span> : null}
      </span>
      <span className="flex h-[52px] items-center rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] px-[17px] text-[16px] text-[#6c737f]">
        —
      </span>
    </label>
  );
}
