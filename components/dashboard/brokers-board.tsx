"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { BrokerLogoPlate } from "@/components/dashboard/broker-mark";
import { usePlaidConnect } from "@/components/dashboard/use-plaid-connect";
import { disconnectBrokerConnection, resyncBrokerConnection } from "@/app/(dashboard)/brokers/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** A position Plaid returned that carried no ticker, so it couldn't be stored as a holding. */
export type UnmatchedPosition = { name: string; quantity: number; security_id: string };

export type BrokerConnectionRow = {
  id: string;
  institution_name: string | null;
  status: "active" | "error" | "disconnected";
  last_synced_at: string | null;
  needs_reauth: boolean;
  unmatched_positions: UnmatchedPosition[] | null;
};

type BrokersBoardProps = {
  isProPlus: boolean;
  connections: BrokerConnectionRow[];
};

/** US institutions Plaid Link commonly covers — each card opens the same picker. */
const PLAID_EXAMPLES = ["TradeStation", "Alpaca", "Fidelity", "E*TRADE"] as const;

function formatLastSync(iso: string | null) {
  if (!iso) return "Last sync: Never";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Last sync: Just now";
  if (mins === 1) return "Last sync: 1 minute ago";
  if (mins < 60) return `Last sync: ${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "Last sync: 1 hour ago";
  if (hours < 24) return `Last sync: ${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Last sync: 1 day ago" : `Last sync: ${days} days ago`;
}

function accountCountLabel(count: number) {
  if (count === 0) return "No accounts linked";
  return `${count} account${count === 1 ? "" : "s"} linked`;
}

export function BrokersBoard({ isProPlus, connections }: BrokersBoardProps) {
  const { connect, reconnect, isPending: isConnecting, error: connectError } = usePlaidConnect();
  const [managing, setManaging] = useState<BrokerConnectionRow | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, startAction] = useTransition();

  const live = connections.filter((c) => c.status !== "disconnected");
  const stale = live.filter((c) => c.needs_reauth);

  function startConnect() {
    if (!isProPlus) return;
    connect();
  }

  function runResync(id: string) {
    setActionError(null);
    setSyncingId(id);
    startAction(async () => {
      const result = await resyncBrokerConnection(id);
      setSyncingId(null);
      if ("error" in result) setActionError(result.error);
      else setManaging(null);
    });
  }

  function runDisconnect(id: string) {
    setActionError(null);
    startAction(async () => {
      const result = await disconnectBrokerConnection(id);
      if ("error" in result) setActionError(result.error);
      else setManaging(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Integrations</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Broker connections
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          Link brokerage accounts to sync holdings and dividend payments automatically, in read-only mode.
        </p>
      </header>

      {/* Bank logins expire every few months — without a prompt this deep
          in the app, a dead connection just quietly stops syncing. */}
      {stale.length > 0 ? (
        <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-[rgba(224,164,92,0.35)] bg-[#241d12] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium leading-[23.1px] text-[#e0a45c]">
              {stale.length === 1
                ? `${stale[0]!.institution_name?.trim() || "A broker"} needs you to sign in again`
                : `${stale.length} brokers need you to sign in again`}
            </p>
            <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
              Holdings stopped syncing. Reconnecting takes a few seconds and keeps your history.
            </p>
          </div>
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => {
              setActionError(null);
              reconnect(stale[0]!.id);
            }}
            className="h-9 shrink-0 rounded-[10px] bg-[#e0a45c] px-4 text-[13px] font-semibold text-[#0b0c0e] hover:bg-[#e0a45c]/90 disabled:opacity-40"
          >
            {isConnecting ? "Opening…" : "Reconnect"}
          </button>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="border-b border-[#22262c] px-6 py-5">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            Connected brokers
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{accountCountLabel(live.length)}</p>
        </header>
        {live.length === 0 ? (
          <p className="px-6 py-5 text-[13px] leading-[21.45px] text-[#99a1ac]">
            No brokers connected. Use Plaid Link below to pick a US brokerage.
          </p>
        ) : (
          <ul>
            {live.map((row, i) => {
              const name = row.institution_name?.trim() || "Connected broker";
              const syncing = syncingId === row.id;
              return (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4 ${
                    i < live.length - 1 ? "border-b border-[#22262c]" : ""
                  }`}
                >
                  <BrokerLogoPlate name={row.institution_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium leading-[23.1px] text-[#f2f4f7]">{name}</p>
                    <p className="text-[12px] leading-[19.8px] text-[#6c737f]">
                      {syncing ? "Last sync: In progress" : formatLastSync(row.last_synced_at)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#2e343b] bg-[#16191d] px-[9px] py-1 text-[11px] tracking-[1.1px] text-[#99a1ac] uppercase">
                    <FigmaIcon src="/marketing/dashboard/icon-readonly.svg" className="size-[11px] text-[#99a1ac]" />
                    Read-only
                  </span>
                  <StatusBadge status={row.status} syncing={syncing} needsReauth={row.needs_reauth} />
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setManaging(row);
                    }}
                    className="h-9 rounded-[10px] px-[15px] text-[13px] font-medium text-[#99a1ac] hover:text-[#f2f4f7]"
                  >
                    Manage
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="border-b border-[#22262c] px-6 py-5">
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            Available brokers
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
            {isProPlus
              ? "Opens Plaid Link — pick any supported US broker. Not a limited list."
              : "Broker auto-sync is Pro+. Upgrade to connect a US brokerage via Plaid."}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-4 p-6 min-[1100px]:grid-cols-4">
          {PLAID_EXAMPLES.map((name) => (
            <button
              key={name}
              type="button"
              disabled={!isProPlus || isConnecting}
              onClick={startConnect}
              className="flex flex-col items-center gap-[11px] rounded-[14px] border border-[#2e343b] px-4 py-6 text-center hover:border-[#4c82f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex size-10 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#0b0c0e]">
                <FigmaIcon src="/marketing/dashboard/icon-plug.svg" className="size-[17px] text-[#99a1ac]" />
              </span>
              <span className="text-[13px] font-medium leading-[21.45px] text-[#f2f4f7]">{name}</span>
              <span className="text-[11px] leading-[18.15px] text-[#6c737f]">
                {!isProPlus ? "Pro+" : isConnecting ? "Connecting…" : "Connect"}
              </span>
            </button>
          ))}
        </div>
        {!isProPlus ? (
          <div className="border-t border-[#22262c] px-6 py-4">
            <Link href="/settings" className="text-[13px] text-[#4c82f7] hover:underline">
              Upgrade in Settings
            </Link>
          </div>
        ) : null}
        {connectError ? (
          <p role="alert" className="border-t border-[#22262c] px-6 py-4 text-[13px] text-[#d8695f]">
            {connectError}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
        <header className="border-b border-[#22262c] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#16191d]">
              <FigmaIcon src="/marketing/dashboard/icon-secure.svg" className="size-3.5 text-[#99a1ac]" />
            </span>
            <div>
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                How your data stays secure
              </h2>
              <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Read-only, encrypted, revocable</p>
            </div>
          </div>
        </header>
        <div className="grid gap-6 p-6 min-[900px]:grid-cols-3">
          <SecurePoint
            icon="/marketing/dashboard/icon-secure-check.svg"
            text="Connections are read-only. PaidPrime can never place trades or move funds."
          />
          <SecurePoint
            icon="/marketing/dashboard/icon-secure-lock.svg"
            text="Plaid holds the login. We store an encrypted access token (AES-256-GCM) and never see your broker password."
          />
          <SecurePoint
            icon="/marketing/dashboard/icon-secure-revoke.svg"
            text="Revoke access for any broker instantly — holdings from that account stop syncing immediately."
          />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>

      <Dialog open={managing != null} onOpenChange={(open) => !open && setManaging(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage connection</DialogTitle>
            <DialogDescription>
              {managing?.institution_name?.trim() || "Connected broker"} — sync again or revoke Plaid access.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p role="alert" className="text-[13px] text-[#d8695f]">
              {actionError}
            </p>
          ) : null}

          {/* Positions Plaid sent that have no ticker — mutual funds,
              treasuries, sweep vehicles. They can't be stored as holdings,
              but the user is entitled to know they're missing rather than
              wonder why the totals look light. */}
          {managing?.unmatched_positions?.length ? (
            <div className="rounded-[10px] border border-[#2e343b] bg-[#16191d] px-4 py-3">
              <p className="text-[13px] font-medium leading-[21.45px] text-[#f2f4f7]">
                {managing.unmatched_positions.length}{" "}
                {managing.unmatched_positions.length === 1 ? "position" : "positions"} couldn&rsquo;t be matched to a ticker
              </p>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {managing.unmatched_positions.map((position) => (
                  <li key={position.security_id} className="text-[12px] leading-[19.8px] text-[#99a1ac]">
                    {position.name} · {position.quantity}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] leading-[19.8px] text-[#6c737f]">
                Your broker didn&rsquo;t report a symbol for these, so they aren&rsquo;t tracked. Add them manually if you want them counted.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {managing?.needs_reauth ? (
              <button
                type="button"
                disabled={isConnecting || !managing}
                onClick={() => {
                  setActionError(null);
                  reconnect(managing.id);
                }}
                className="h-10 rounded-[10px] bg-[#e0a45c] px-4 text-[13px] font-semibold text-[#0b0c0e] hover:bg-[#e0a45c]/90 disabled:opacity-40"
              >
                {isConnecting ? "Opening…" : "Reconnect"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={isActing || !managing}
              onClick={() => managing && runResync(managing.id)}
              className="h-10 rounded-[10px] border border-[#2e343b] bg-[#16191d] px-4 text-[13px] font-medium text-[#f2f4f7] hover:border-[#4c82f7] disabled:opacity-40"
            >
              {syncingId === managing?.id ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              disabled={isActing || !managing}
              onClick={() => managing && runDisconnect(managing.id)}
              className="h-10 rounded-[10px] border border-[rgba(216,105,95,0.3)] bg-[#261615] px-4 text-[13px] font-medium text-[#d8695f] hover:border-[#d8695f] disabled:opacity-40"
            >
              Disconnect
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({
  status,
  syncing,
  needsReauth,
}: {
  status: BrokerConnectionRow["status"];
  syncing: boolean;
  needsReauth: boolean;
}) {
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[rgba(76,130,247,0.3)] bg-[#16233d] px-[9px] py-1 text-[11px] tracking-[1.1px] text-[#4c82f7] uppercase">
        <FigmaIcon src="/marketing/dashboard/icon-syncing.svg" className="size-[11px] animate-spin text-[#4c82f7]" />
        Syncing
      </span>
    );
  }
  // Checked before status, and worded as an instruction rather than
  // "Attention" — this state has exactly one fix and the user is the only
  // one who can perform it.
  if (needsReauth) {
    return (
      <span className="inline-flex items-center rounded-[8px] border border-[rgba(224,164,92,0.35)] bg-[#241d12] px-[9px] py-1 text-[11px] tracking-[1.1px] text-[#e0a45c] uppercase">
        Reconnect
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center rounded-[8px] border border-[rgba(216,105,95,0.3)] bg-[#261615] px-[9px] py-1 text-[11px] tracking-[1.1px] text-[#d8695f] uppercase">
        Attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[8px] border border-[rgba(63,191,135,0.3)] bg-[#10261e] px-[9px] py-1 text-[11px] tracking-[1.1px] text-[#3fbf87] uppercase">
      Synced
    </span>
  );
}

function SecurePoint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <FigmaIcon src={icon} className="mt-0.5 size-[18px] shrink-0 text-[#3fbf87]" />
      <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">{text}</p>
    </div>
  );
}
