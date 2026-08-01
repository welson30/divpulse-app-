import { InfoTip } from "@/components/dashboard/info-tip";
import { TIPS } from "@/lib/tips";

export type DividendHistoryRow = {
  payDate: string;
  exDate: string | null;
  amountPerShare: number;
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const HEAD = "border-b border-border-subtle px-sp-3 py-3.5 font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase";
const DISPLAY_LIMIT = 60;

/**
 * Ticker-scoped variant of the "Dividend history" table on
 * app/(dashboard)/dividends/page.tsx — same date/per-share columns, but
 * no logo/name column (redundant, the whole page is already this
 * ticker) and "Your shares"/"Your payout" only appear when held.
 *
 * dividend_events.pay_date is Yahoo's ex-date used as a pay-date proxy
 * (documented limitation) — the date column is labeled "Ex-date", not
 * "Pay date", reusing TIPS.exDate verbatim to avoid reintroducing the
 * confusion already explained once elsewhere in the app.
 */
export function DividendHistoryTable({ events, shares }: { events: DividendHistoryRow[]; shares?: number }) {
  if (events.length === 0) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
        No dividend history found for this ticker.
      </div>
    );
  }

  const visible = events.slice(0, DISPLAY_LIMIT);
  const held = shares != null && shares > 0;

  return (
    <div className="flex flex-col gap-sp-2">
      {events.length > DISPLAY_LIMIT ? (
        <p className="-mt-1 text-xs text-text-secondary">
          Most recent {DISPLAY_LIMIT} of {events.length} payouts.
        </p>
      ) : null}
      <div className="w-full overflow-x-auto overflow-y-hidden rounded-card border border-border-subtle bg-surface">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className={`${HEAD} text-left`}>
                <span className="inline-flex items-center gap-1">Ex-date <InfoTip label={TIPS.exDate} /></span>
              </th>
              <th className={`${HEAD} text-right`}>
                <span className="inline-flex items-center gap-1">Per share <InfoTip label={TIPS.perShare} /></span>
              </th>
              {held ? <th className={`${HEAD} text-right`}>Your payout</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((event, i) => {
              const payout = held ? event.amountPerShare * shares! : null;
              return (
                <tr
                  key={`${event.payDate}-${i}`}
                  className={`transition-colors hover:bg-surface-hover ${i === visible.length - 1 ? "" : "border-b border-border-subtle"}`}
                >
                  <td className="px-sp-3 py-3 text-[13px] text-text-secondary">{formatDate(event.exDate ?? event.payDate)}</td>
                  <td className="px-sp-3 py-3 text-right font-mono text-sm tabular-nums text-text-secondary">
                    ${event.amountPerShare.toFixed(4)}
                  </td>
                  {held ? (
                    <td className="px-sp-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-green-500">
                      +${payout!.toFixed(2)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
