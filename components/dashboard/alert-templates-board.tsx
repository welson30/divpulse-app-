"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  disablePushAlerts,
  disconnectTelegram,
  getTelegramLinkUrl,
  setNotificationStyle,
} from "@/app/(dashboard)/settings/actions";
import { savePushToken } from "@/app/(dashboard)/notifications/actions";
import { requestPushToken, getExistingPushToken } from "@/lib/firebase/client";
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
  const t = useTranslations("dashboard.alertTemplates");
  const router = useRouter();
  const [selected, setSelected] = useState<NotificationStyle>(notificationStyle);
  const amount = formatMoney(preview.amount);
  const broker = preview.broker?.trim() || "your linked broker";
  const templates: TemplateCard[] = [
    {
      value: "compact",
      label: t("templatePrivacy"),
      recommended: true,
      title: t("dividendReceived"),
      amount,
      extra: [preview.ticker],
    },
    {
      value: "descriptive",
      label: t("templateStandard"),
      title: `${t("dividendReceived")} · ${preview.ticker}`,
      amount,
      extra: [t("nowInAccount")],
    },
    {
      value: "premium",
      label: t("templateDetailed"),
      title: `Dividend confirmed · ${preview.ticker}`,
      amount,
      extra: [`${t("paidBy")} ${broker}`, t("verifiedNote")],
    },
  ];
  const [pushOn, setPushOn] = useState(pushEnabled);
  const [telegramOn, setTelegramOn] = useState(telegramConnected);
  const [error, setError] = useState<string | null>(null);
  // Same "blocked by an ad blocker/privacy extension" case main's
  // EnableNotificationsButton surfaces via a dialog rather than inline
  // text — a permission problem is easy to miss in a page-bottom banner,
  // so it gets the same modal treatment here.
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  // Three independent transitions, not one shared — a single useTransition()
  // here previously meant clicking any one control (a template card, Push,
  // or Telegram) disabled all the others too while its own request was in
  // flight, even though they're unrelated actions. Same bug class already
  // fixed this session in collection-table.tsx/watchlist-table.tsx.
  const [styleSaving, startStyleTransition] = useTransition();
  const [pushSaving, startPushTransition] = useTransition();
  const [telegramSaving, startTelegramTransition] = useTransition();

  // pushEnabled (the initial prop) is account-wide — computed server-side
  // from whether ANY device has a saved push_subscriptions row, per
  // components/dashboard/notification-bell.tsx's original account-level
  // model. It says nothing about whether THIS browser ever granted
  // permission. Without this check, a device that's never asked would
  // still show the switch as "on" (because some other device is
  // registered), so clicking it would silently delete every other
  // device's subscription instead of ever calling
  // Notification.requestPermission() on this one. main's
  // EnableNotificationsButton avoided exactly this by checking a real,
  // per-browser token via getExistingPushToken() instead of trusting an
  // account-wide flag — same fix here.
  useEffect(() => {
    let cancelled = false;
    getExistingPushToken()
      .then(async (token) => {
        if (cancelled) return;
        if (token) {
          // Self-heal: confirm the server actually has this device's
          // token on file (a prior save may have failed silently).
          await savePushToken(token, navigator.userAgent);
          if (!cancelled) setPushOn(true);
        } else {
          setPushOn(false);
        }
      })
      .catch(() => {
        if (!cancelled) setPushOn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function pickStyle(value: NotificationStyle) {
    if (value === selected || styleSaving) return;
    const previous = selected;
    setSelected(value);
    setError(null);
    startStyleTransition(async () => {
      try {
        const result = await setNotificationStyle(value);
        if (result && "error" in result) {
          setSelected(previous);
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setSelected(previous);
        setError(t("errorSave"));
      }
    });
  }

  function togglePush() {
    if (pushSaving) return;
    setError(null);
    if (pushOn) {
      setPushOn(false);
      startPushTransition(async () => {
        try {
          const result = await disablePushAlerts();
          if (result?.error) {
            setPushOn(true);
            setError(result.error);
            return;
          }
          router.refresh();
        } catch {
          setPushOn(true);
          setError(t("errorPushDisable"));
        }
      });
      return;
    }
    startPushTransition(async () => {
      try {
        // requestPushToken() first calls Notification.requestPermission()
        // — the actual browser permission prompt — then throws for a
        // range of separate reasons (blocked by an ad blocker/privacy
        // extension, a stale conflicting service worker registration, FCM
        // rejecting the subscription) even once permission is granted.
        // Both a null return and a thrown exception land here as "the
        // browser is still preventing this," same as main's dialog.
        const token = await requestPushToken();
        if (!token) {
          setPermissionBlocked(true);
          return;
        }
        const result = await savePushToken(token, navigator.userAgent);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setPushOn(true);
        router.refresh();
      } catch {
        setPermissionBlocked(true);
      }
    });
  }

  function toggleTelegram() {
    if (telegramSaving) return;
    setError(null);
    if (!isPro) {
      setError(t("errorTelegramPro"));
      return;
    }
    if (telegramOn) {
      setTelegramOn(false);
      startTelegramTransition(async () => {
        try {
          await disconnectTelegram();
          router.refresh();
        } catch {
          setTelegramOn(true);
          setError(t("errorTelegramDisconnect"));
        }
      });
      return;
    }
    // Opened synchronously, inside the click handler, so the browser still
    // treats it as a direct result of user input. Calling window.open()
    // only after the awaited server action below loses that "user
    // activation" window and gets silently popup-blocked in most browsers.
    // Deliberately no noopener/noreferrer here — per spec, either one makes
    // window.open() return null, which would throw away the only handle we
    // have to navigate this tab once the URL is ready, leaving it stuck
    // blank forever (exactly what happened before this fix).
    const popup = window.open("", "_blank");
    startTelegramTransition(async () => {
      try {
        const result = await getTelegramLinkUrl();
        if ("error" in result) {
          popup?.close();
          setError(result.error);
          return;
        }
        if (popup) {
          popup.location.href = result.url;
        } else {
          window.open(result.url, "_blank", "noopener,noreferrer");
        }
      } catch {
        popup?.close();
        setError(t("errorTelegramConnect"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          {t("description")}
        </p>
      </header>

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <div className="border-b border-[#22262c] px-6 py-5">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            {t("chooseTemplate")}
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
            {preview.fromLivePayment
              ? t("previewLive", { ticker: preview.ticker })
              : t("previewIllustrative")}
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
                disabled={styleSaving}
                className="flex flex-col gap-3 py-4 text-left disabled:opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#f2f4f7]">{card.label}</span>
                  {card.recommended ? (
                    <span className="rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-2 py-[4px] text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
                      {t("recommended")}
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
                  {active ? t("selected") : t("select")}
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
              {t("channelsTitle")}
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{t("channelsSub")}</p>
          </div>
          <ChannelRow
            label={t("pushNotifications")}
            icon="/marketing/dashboard/icon-channel-push-16.svg"
            on={pushOn}
            onToggle={togglePush}
            disabled={pushSaving}
          />
          <ChannelRow
            label={t("telegramBot")}
            icon="/marketing/dashboard/icon-channel-telegram-16.svg"
            on={telegramOn}
            onToggle={toggleTelegram}
            disabled={telegramSaving}
            hint={!isPro ? t("proLabel") : telegramOn ? undefined : t("opensInTelegram")}
          />
          <ChannelRow
            label={t("emailDigest")}
            icon="/marketing/dashboard/icon-channel-email-16.svg"
            on={false}
            disabled
            hint={t("emailNotAvailable")}
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
                  {t("quietTitle")}
                </h2>
                <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
                  {t("quietSub")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 p-6">
            <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
              {t("quietText")}
            </p>
            <div className="grid gap-4 min-[520px]:grid-cols-2">
              <DisabledField label={t("quietStart")} />
              <DisabledField label={t("quietEnd")} />
            </div>
            <DisabledField label={t("minThreshold")} hint={t("minThresholdHint")} />
          </div>
        </section>
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-red-400">
          {error}
        </p>
      ) : null}

      <Dialog open={permissionBlocked} onOpenChange={setPermissionBlocked}>
        <DialogContent className="border-[#22262c] bg-[#121417]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-funnel-display)] text-[#f2f4f7]">
              {t("blockedTitle")}
            </DialogTitle>
            <DialogDescription className="text-[#99a1ac]">
              {t("blockedDesc")}
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setPermissionBlocked(false)}
            className="mt-4 h-10 w-full rounded-[10px] bg-[#4c82f7] px-4 text-[13px] font-medium text-white hover:bg-[#3d72e8]"
          >
            {t("blockedGotIt")}
          </button>
        </DialogContent>
      </Dialog>
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
          on ? "justify-end border-[#3fbf87] bg-[#3fbf87]" : "justify-start border-[#3a4048] bg-[#2e343b]",
          (!onToggle || disabled) && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={cn("size-[18px] rounded-full shadow-sm transition-colors", on ? "bg-white" : "bg-[#6c737f]")} />
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
