"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { markAllNotificationsRead } from "@/app/(dashboard)/notifications/actions";
import { isLinkableTicker } from "@/lib/tickers/validate";
import { cn } from "@/lib/utils";

export type InboxChannel = "push" | "telegram" | "email";

export type InboxItem = {
  id: string;
  ticker: string;
  amount: number;
  broker: string | null;
  notifiedAt: string;
  channels: InboxChannel[];
};

type Tab = "inbox" | "archived";
type ChannelFilter = "all" | InboxChannel;

const CHANNELS: { id: ChannelFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "push", label: "Push" },
  { id: "telegram", label: "Telegram" },
  { id: "email", label: "Email" },
];

const CHANNEL_PILL: Record<InboxChannel, { label: string; icon: string; className: string }> = {
  push: {
    label: "Push",
    icon: "/marketing/dashboard/icon-channel-push.svg",
    className: "border-[rgba(76,130,247,0.3)] bg-[#16233d] text-[#4c82f7]",
  },
  telegram: {
    label: "Telegram",
    icon: "/marketing/dashboard/icon-channel-telegram.svg",
    className: "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]",
  },
  email: {
    label: "Email",
    icon: "/marketing/dashboard/icon-channel-email.svg",
    className: "border-[#2e343b] bg-[#16191d] text-[#99a1ac]",
  },
};

function dayStamp(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDayStamp(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatEarlier(iso: string) {
  const date = new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date} · ${formatTime(iso)}`;
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emptyCopy(total: number, channel: ChannelFilter) {
  if (total === 0) {
    return "No notifications yet — you'll see dividend payments here as they're detected.";
  }
  if (channel === "email") {
    return "No email alerts. PaidPrime sends dividend notifications on Push and Telegram.";
  }
  if (channel === "all") return "No notifications yet.";
  const label = CHANNELS.find((c) => c.id === channel)?.label ?? "matching";
  return `No ${label} notifications.`;
}

type GroupId = "today" | "yesterday" | "earlier";

function groupId(iso: string): GroupId {
  const stamp = dayStamp(iso);
  if (stamp === localDayStamp(0)) return "today";
  if (stamp === localDayStamp(-1)) return "yesterday";
  return "earlier";
}

export function NotificationsInbox({ items, lastSeenAt }: { items: InboxItem[]; lastSeenAt: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("inbox");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [seenAt, setSeenAt] = useState(lastSeenAt);
  const [pending, startTransition] = useTransition();

  const seenMs = new Date(seenAt).getTime();
  const unreadCount = items.filter((item) => new Date(item.notifiedAt).getTime() > seenMs).length;

  const filtered = useMemo(() => {
    if (channel === "all") return items;
    return items.filter((item) => item.channels.includes(channel));
  }, [items, channel]);

  const groups = useMemo(() => {
    const buckets: Record<GroupId, InboxItem[]> = { today: [], yesterday: [], earlier: [] };
    for (const item of filtered) buckets[groupId(item.notifiedAt)].push(item);
    return (
      [
        { id: "today" as const, label: "Today", rows: buckets.today },
        { id: "yesterday" as const, label: "Yesterday", rows: buckets.yesterday },
        { id: "earlier" as const, label: "Earlier", rows: buckets.earlier },
      ] as const
    ).filter((g) => g.rows.length > 0);
  }, [filtered]);

  function markAllRead() {
    if (unreadCount === 0 || pending) return;
    const now = new Date().toISOString();
    setSeenAt(now);
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#22262c] pb-6">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Alerts</p>
          <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
            Notifications
          </h1>
          <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
            Dividend payments across every connected channel.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0 || pending}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-[15px] text-[13px] font-medium text-[#f2f4f7] transition-colors hover:border-[#4c82f7] disabled:cursor-default disabled:opacity-40"
        >
          <FigmaIcon src="/marketing/dashboard/icon-mark-read.svg" className="size-3.5" />
          Mark all read
        </button>
      </header>

      <div className="mt-10 flex items-center gap-2 border-b border-[#22262c] pb-4">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={cn(
            "inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors",
            tab === "inbox" ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#99a1ac] hover:text-[#f2f4f7]",
          )}
        >
          <FigmaIcon src="/marketing/dashboard/icon-inbox.svg" className="size-3.5" />
          Inbox
          {unreadCount > 0 ? (
            <span className="rounded-[8px] border border-[rgba(76,130,247,0.3)] bg-[#16233d] px-2 py-[4px] text-[11px] font-medium tracking-[1.1px] text-[#4c82f7] uppercase">
              {unreadCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("archived")}
          className={cn(
            "inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors",
            tab === "archived" ? "bg-[#16191d] text-[#f2f4f7]" : "text-[#99a1ac] hover:text-[#f2f4f7]",
          )}
        >
          <FigmaIcon src="/marketing/dashboard/icon-archive.svg" className="size-3.5" />
          Archived
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CHANNELS.map((pill) => {
          const active = channel === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setChannel(pill.id)}
              className={cn(
                "rounded-full border px-[15px] py-[7px] text-[12px] font-medium transition-colors",
                active
                  ? "border-[rgba(76,130,247,0.4)] bg-[#16233d] text-[#4c82f7]"
                  : "border-[#2e343b] text-[#99a1ac] hover:border-[#4c82f7] hover:text-[#f2f4f7]",
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {tab === "archived" ? (
          <EmptyCard>
            Nothing archived. Notifications stay in Inbox after you mark them read.
          </EmptyCard>
        ) : groups.length === 0 ? (
          <EmptyCard>{emptyCopy(items.length, channel)}</EmptyCard>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
              <div className="flex items-center justify-between border-b border-[#22262c] px-6 py-5">
                <div>
                  <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                    {group.label}
                  </h2>
                  <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
                    {group.rows.length} {group.rows.length === 1 ? "notification" : "notifications"}
                  </p>
                </div>
              </div>
              <ul>
                {group.rows.map((item, index) => {
                  const unread = new Date(item.notifiedAt).getTime() > seenMs;
                  const title = `Dividend received — ${item.ticker}`;
                  const detail = item.broker
                    ? `+${formatMoney(item.amount)} credited at ${item.broker}`
                    : `+${formatMoney(item.amount)} credited`;
                  const when = group.id === "earlier" ? formatEarlier(item.notifiedAt) : formatTime(item.notifiedAt);
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex items-start gap-4 px-6 py-4",
                        index < group.rows.length - 1 && "border-b border-[#22262c]",
                      )}
                    >
                      <span className="mt-2 flex w-1.5 shrink-0 justify-center">
                        {unread ? <span className="size-1.5 rounded-full bg-[#4c82f7]" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        {isLinkableTicker(item.ticker) ? (
                          <Link
                            href={`/tickers/${item.ticker}`}
                            className={cn(
                              "block truncate text-[14px] leading-[23.1px] hover:underline",
                              unread ? "font-medium text-[#f2f4f7]" : "font-normal text-[#99a1ac]",
                            )}
                          >
                            {title}
                          </Link>
                        ) : (
                          <p
                            className={cn(
                              "truncate text-[14px] leading-[23.1px]",
                              unread ? "font-medium text-[#f2f4f7]" : "font-normal text-[#99a1ac]",
                            )}
                          >
                            {title}
                          </p>
                        )}
                        <p className="mt-1 truncate text-[13px] leading-[21.45px] text-[#6c737f]">{detail}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 min-[720px]:flex-row min-[720px]:items-start min-[720px]:gap-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {item.channels.map((ch) => {
                            const pill = CHANNEL_PILL[ch];
                            return (
                              <span
                                key={ch}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-[4px] text-[11px] tracking-[1.1px] uppercase",
                                  pill.className,
                                )}
                              >
                                <FigmaIcon src={pill.icon} className="size-[11px]" />
                                {pill.label}
                              </span>
                            );
                          })}
                        </div>
                        <p className="pt-px text-[12px] leading-[19.8px] tracking-[-0.24px] whitespace-nowrap text-[#6c737f]">
                          {when}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-10 text-center text-[13px] leading-[21.45px] text-[#99a1ac]">
      {children}
    </div>
  );
}
