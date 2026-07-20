import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dividends — PaidPrime",
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DividendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdings } = await supabase.from("holdings").select("id, ticker, shares").eq("user_id", user!.id);

  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];

  const [{ data: payments }, { data: events }] = await Promise.all([
    supabase
      .from("dividend_payments")
      .select("id, amount, pay_date, holding_id")
      .eq("user_id", user!.id)
      .order("pay_date", { ascending: false }),
    tickers.length > 0
      ? supabase
          .from("dividend_events")
          .select("id, ticker, ex_date, pay_date, amount_per_share")
          .in("ticker", tickers)
          .order("pay_date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const holdingById = new Map((holdings ?? []).map((h) => [h.id, h]));
  const totalConfirmed = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  if (tickers.length === 0) {
    return (
      <div className="flex flex-col gap-sp-3">
        <div>
          <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
          <h1 className="text-h1 font-display font-semibold text-text-primary">Dividends</h1>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface-2 p-sp-6 text-center">
          <p className="text-sm text-text-secondary">Add a holding to start tracking dividend income.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div>
        <span className="mb-1 block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">Portfolio</span>
        <h1 className="text-h1 font-display font-semibold text-text-primary">Dividends</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {(payments ?? []).length === 0
            ? "No confirmed payments yet — detected payouts will appear here the day they land."
            : `$${totalConfirmed.toFixed(2)} confirmed across ${payments!.length} ${payments!.length === 1 ? "payment" : "payments"}`}
        </p>
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Confirmed payments</h2>
        {(payments ?? []).length === 0 ? (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
            Nothing detected yet. The daily check runs automatically — this fills in the moment a tracked holding pays.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Ticker
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Pay date
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments!.map((payment, i) => (
                  <tr key={payment.id} className={i === payments!.length - 1 ? "" : "border-b border-border-subtle"}>
                    <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">
                      {holdingById.get(payment.holding_id)?.ticker ?? "—"}
                    </td>
                    <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{formatDate(payment.pay_date)}</td>
                    <td className="px-sp-3 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-green-500">
                      +${Number(payment.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-sp-2">
        <h2 className="text-h2 font-display font-medium text-text-primary">Dividend history</h2>
        <p className="-mt-1 text-xs text-text-secondary">Past payouts for your tracked tickers, per share.</p>
        {(events ?? []).length === 0 ? (
          <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-4 text-sm text-text-secondary">
            No dividend history found yet for your tracked tickers.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Ticker
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Ex-date
                  </th>
                  <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">
                    Per share
                  </th>
                </tr>
              </thead>
              <tbody>
                {events!.map((event, i) => (
                  <tr key={event.id} className={i === events!.length - 1 ? "" : "border-b border-border-subtle"}>
                    <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">{event.ticker}</td>
                    <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">
                      {event.ex_date ? formatDate(event.ex_date) : "—"}
                    </td>
                    <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">
                      ${Number(event.amount_per_share).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
