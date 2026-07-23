import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { sendDividendPush } from "@/lib/firebase/admin";
import { sendTelegramDividendAlert } from "@/lib/telegram/send";

export const maxDuration = 60;

/**
 * The dividend detection job — ARCHITECTURE.md §9.1, the core value prop.
 * Triggered daily by Vercel Cron (see vercel.json), protected by
 * CRON_SECRET so only Vercel's own scheduler can invoke it.
 *
 * Algorithm (idempotent — safe to re-run after a crash or manual retry):
 *   1. SELECT DISTINCT ticker FROM holdings
 *   2. For each ticker: fetch dividend data, upsert into dividend_events
 *      (unique on ticker+pay_date, so a re-fetch never duplicates a row)
 *   3. For each dividend_event paid today: for each holding on that
 *      ticker, insert a dividend_payments row (unique on
 *      holding_id+dividend_event_id — this constraint is what makes
 *      re-running the job safe; a second insert attempt for an
 *      already-processed payment just violates the constraint and is
 *      skipped, never double-counted or double-notified)
 *
 * Push (Firebase Cloud Messaging, direct — see lib/firebase/admin.ts)
 * fires immediately after each successful dividend_payments insert, to
 * every device/browser the user has registered in push_subscriptions
 * (there can be more than one). A push failure never rolls back the
 * insert: the payments ledger is the source of truth, delivery is
 * best-effort. Stale tokens (uninstalled/cleared site data) are pruned
 * from push_subscriptions when FCM reports them as no longer registered.
 *
 * Telegram (see lib/telegram/send.ts) fires alongside push, gated to
 * Pro/Pro+ plans (checked server-side against profiles.plan — never
 * trust a client-set flag for this) and only if the user has completed
 * the /settings linking flow (telegram_links.chat_id is set). A chat
 * Telegram reports as blocked/deleted clears chat_id so the next run
 * doesn't keep failing against it. Email is not wired in yet.
 *
 * Replaces the earlier OneSignal integration, which could not complete a
 * TLS handshake to api.onesignal.com from Pakistani networks — reproduced
 * consistently across devices/browsers/ISPs while working fine from a US
 * connection, so it was judged an infrastructure issue on OneSignal's
 * Cloudflare zone rather than something fixable in application code.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: holdings, error: holdingsError } = await supabase
    .from("holdings")
    .select("id, user_id, ticker, shares, broker_name");

  if (holdingsError) {
    return NextResponse.json({ error: holdingsError.message }, { status: 500 });
  }

  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const provider = getDividendDataProvider();

  const tickerErrors: { ticker: string; error: string }[] = [];
  let eventsUpserted = 0;
  let paymentsInserted = 0;

  for (const ticker of tickers) {
    try {
      const events = await provider.fetchDividends(ticker);
      if (events.length === 0) continue;

      const { data: upserted, error: upsertError } = await supabase
        .from("dividend_events")
        .upsert(
          events.map((e) => ({
            ticker: e.ticker,
            ex_date: e.exDate,
            pay_date: e.payDate,
            amount_per_share: e.amountPerShare,
            source: "yahoo_finance",
          })),
          { onConflict: "ticker,pay_date", ignoreDuplicates: false },
        )
        .select("id, ticker, pay_date, amount_per_share");

      if (upsertError) {
        tickerErrors.push({ ticker, error: upsertError.message });
        continue;
      }

      eventsUpserted += upserted?.length ?? 0;

      const eventsPaidToday = (upserted ?? []).filter((e) => e.pay_date === today);
      if (eventsPaidToday.length === 0) continue;

      const holdingsForTicker = (holdings ?? []).filter((h) => h.ticker === ticker);

      for (const event of eventsPaidToday) {
        for (const holding of holdingsForTicker) {
          const amount = holding.shares * event.amount_per_share;

          const { data: inserted, error: insertError } = await supabase
            .from("dividend_payments")
            .insert({
              user_id: holding.user_id,
              holding_id: holding.id,
              dividend_event_id: event.id,
              amount,
              pay_date: event.pay_date,
            })
            .select("id")
            .single();

          // 23505 = unique_violation — this payment was already recorded
          // by a prior run of this job. Expected on re-runs, not a
          // failure; anything else is a real error worth surfacing. Both
          // cases: skip the push, since either nothing new happened or
          // the row (and therefore the notified_at update target) doesn't
          // exist to update.
          if (insertError) {
            if (insertError.code !== "23505") {
              tickerErrors.push({ ticker, error: insertError.message });
            }
            continue;
          }

          paymentsInserted += 1;

          const { data: subscriptions } = await supabase
            .from("push_subscriptions")
            .select("id, fcm_token")
            .eq("user_id", holding.user_id);

          let anySent = false;
          const channelsNotified: string[] = [];

          for (const subscription of subscriptions ?? []) {
            const result = await sendDividendPush(subscription.fcm_token, ticker, amount);
            if (result.sent) {
              anySent = true;
            } else if (result.staleToken) {
              await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
            }
          }
          if (anySent) channelsNotified.push("push");

          // Telegram alerts are Pro/Pro+ only — the plan check happens
          // here (server-side, via the service-role client) rather than
          // trusting anything client-set, same reasoning as the Free-plan
          // holdings cap (ARCHITECTURE.md §10).
          const { data: profile } = await supabase.from("profiles").select("plan").eq("id", holding.user_id).single();
          const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";

          if (isPro) {
            const { data: telegramLink } = await supabase
              .from("telegram_links")
              .select("chat_id")
              .eq("user_id", holding.user_id)
              .not("chat_id", "is", null)
              .maybeSingle();

            if (telegramLink?.chat_id) {
              const result = await sendTelegramDividendAlert(telegramLink.chat_id, ticker, amount, holding.broker_name ?? null);
              if (result.sent) {
                channelsNotified.push("telegram");
              } else if (result.chatInvalid) {
                await supabase.from("telegram_links").update({ chat_id: null, linked_at: null }).eq("user_id", holding.user_id);
              }
            }
          }

          if (channelsNotified.length > 0 && inserted) {
            await supabase
              .from("dividend_payments")
              .update({ notified_at: new Date().toISOString(), notified_channels: channelsNotified })
              .eq("id", inserted.id);
          }
        }
      }
    } catch (err) {
      tickerErrors.push({ ticker, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    tickersChecked: tickers.length,
    eventsUpserted,
    paymentsInserted,
    errors: tickerErrors,
  });
}
