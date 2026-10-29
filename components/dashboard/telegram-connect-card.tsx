"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getTelegramLinkUrl, disconnectTelegram } from "@/app/(dashboard)/settings/actions";

type TelegramConnectCardProps = {
  isPro: boolean;
  isConnected: boolean;
};

export function TelegramConnectCard({ isPro, isConnected }: TelegramConnectCardProps) {
  const t = useTranslations("dashboard.settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isPro) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <div>
          <div className="text-sm text-text-primary">{t("telegramTitle")}</div>
          <div className="text-xs text-text-secondary">{t("telegramDescPro")}</div>
        </div>
        <span className="shrink-0 rounded-full border border-border-subtle px-2.5 py-1 font-mono text-[10px] text-text-secondary">
          {t("telegramProOnly")}
        </span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface p-sp-3">
        <div>
          <div className="text-sm text-text-primary">{t("telegramTitle")}</div>
          <div className="text-xs text-green-500">{t("telegramConnected")}</div>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => disconnectTelegram())}
          className="shrink-0 font-sans text-xs text-text-secondary transition-colors hover:text-red-500 disabled:opacity-40"
        >
          {t("telegramDisconnect")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border-subtle bg-surface p-sp-3">
      <div>
        <div className="text-sm text-text-primary">{t("telegramTitle")}</div>
        <div className="text-xs text-text-secondary">{t("telegramDescConnect")}</div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await getTelegramLinkUrl();
            if ("error" in result) {
              setError(result.error);
              return;
            }
            window.open(result.url, "_blank", "noopener,noreferrer");
          })
        }
        className="self-start rounded-control bg-green-500 px-3.5 py-2 font-sans text-xs font-semibold text-canvas transition-colors hover:bg-green-500/90 disabled:opacity-40"
      >
        {isPending ? t("telegramOpening") : t("telegramConnect")}
      </button>
    </div>
  );
}
