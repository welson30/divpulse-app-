"use client";

import { usePlaidConnect } from "@/components/dashboard/use-plaid-connect";

type PlaidConnection = {
  id: string;
  institution_name: string | null;
  status: "active" | "error" | "disconnected";
  last_synced_at: string | null;
};

type PlaidConnectCardProps = {
  isProPlus: boolean;
  connections: PlaidConnection[];
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "never";
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function PlaidConnectCard({ isProPlus, connections }: PlaidConnectCardProps) {
  const { connect, isPending, error } = usePlaidConnect();

  if (!isProPlus) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <div>
          <div className="text-sm text-text-primary">Broker auto-sync</div>
          <div className="text-xs text-text-secondary">Connect a US broker and holdings sync automatically — Pro+ feature.</div>
        </div>
        <span className="shrink-0 rounded-full border border-border-subtle px-2.5 py-1 font-mono text-[10px] text-text-secondary">
          Pro+ only
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sp-2">
      {connections.length > 0 ? (
        <div className="flex flex-col gap-2">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface p-sp-3"
            >
              <div>
                <div className="text-sm text-text-primary">{connection.institution_name ?? "Connected broker"}</div>
                <div className="text-xs text-text-secondary">
                  {connection.status === "active" ? (
                    <span className="text-green-500">Synced</span>
                  ) : connection.status === "error" ? (
                    <span className="text-red-500">Sync error — reconnect</span>
                  ) : (
                    "Disconnected"
                  )}{" "}
                  · last synced {formatDate(connection.last_synced_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isPending}
        onClick={connect}
        className="self-start rounded-control bg-green-500 px-3.5 py-2 font-sans text-xs font-semibold text-canvas transition-colors hover:bg-green-500/90 disabled:opacity-40"
      >
        {isPending ? "Connecting…" : connections.length > 0 ? "Connect another broker" : "Connect a broker"}
      </button>
    </div>
  );
}
