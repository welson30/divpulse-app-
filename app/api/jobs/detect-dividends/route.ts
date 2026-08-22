import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDividendDataProvider } from "@/lib/dividend-data";
import { sendPush } from "@/lib/firebase/admin";
import { sendTelegramMessage } from "@/lib/telegram/send";
import { buildNotificationContent, type NotificationStyle } from "@/lib/notifications/templates";
import { loadBrokerDividends, type BrokerDividendIndex } from "@/lib/notifications/plaid-confirmation";

export const maxDuration = 60;

/**
 * How far back a dividend_event's pay_date may be and still be eligible to
 * produce a payment + notification. Sized to cover Yahoo's same-day
 * publish lag (see the note below) plus a couple of skipped runs, while
 * staying far short of the 365 days of history fetchDividends returns —
 * widening this to "all history" would, on the very next run, insert a
 * payment row for every past event and fire a notification for each one.
 */
const DETECTION_WINDOW_DAYS = 3;

/**
 * The dividend detection job — ARCHITECTURE.md §9.1, the core value prop.
 * Triggered daily by Vercel Cron (see vercel.json), protected by
 * CRON_SECRET so only Vercel's own scheduler can invoke it.
 *
 * Algorithm (idempotent — safe to re-run after a crash or manual retry):
 *   1. SELECT DISTINCT ticker FROM holdings
 *   2. For each ticker: fetch dividend data, upsert into dividend_events
 *      (unique on ticker+pay_date, so a re-fetch never duplicates a row)
 *   3. For each dividend_event whose pay_date falls inside the trailing
 *      DETECTION_WINDOW_DAYS window: for each holding on that ticker,
 *      insert a dividend_payments row (unique on
 *      holding_id+dividend_event_id — this constraint is what makes
 *      re-running the job safe; a second insert attempt for an
 *      already-processed payment just violates the constraint and is
 *      skipped, never double-counted or double-notified)
 *
 * Why a trailing window and not an exact `pay_date === today` match:
 * Yahoo only publishes a dividend into its feed at the ex-date's market
 * open — 13:30 UTC, verified directly against the chart endpoint's raw
 * timestamps. An exact same-day match therefore only works if this job
 * runs after 13:30 UTC on the day of the payout itself; any earlier run
 * sees nothing, and by the next run `today` has rolled over so the event
 * is skipped *permanently*. That was a live production bug: the job was
 * scheduled at 06:00 UTC, 7.5 hours before the data could exist, so every
 * payout was written to dividend_events (the calendar showed it fine) but
 * never produced a payment row or a notification. Confirmed on
 * 2026-07-31: five payouts dated 2026-07-30 carried fetched_at
 * 2026-07-31T06:00Z — first seen a full day late — and the only payment
 * rows in the database came from a manual 22:25 UTC run, never the cron.
 * A trailing window absorbs both the publish lag and an occasional missed
 * run, and staying bounded means a backlog of historical events can never
 * stampede the notification channels.
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
 * Notification style (PRD §4 / ARCHITECTURE.md §3, see
 * lib/notifications/templates.ts) is a per-user preference
 * (profiles.notification_style, set from Settings > Notifications) rather
 * than something this job decides — exactly one push and one Telegram
 * message go out per detected payment, built by buildNotificationContent:
 *   - compact — ticker + amount only.
 *   - descriptive — confirms the money has landed, no broker named.
 *   - premium — names the broker and shows a confirmed checkmark, but only
 *     when the user has an active Plaid connection AND lib/notifications/
 *     plaid-confirmation.ts finds a matching real transaction in their
 *     linked account within the last few days. Degrades to descriptive
 *     (never a fabricated confirmation) when no match exists yet.
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
  const windowStart = new Date(Date.now() - DETECTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: holdings, error: holdingsError } = await supabase
    .from("holdings")
    .select("id, user_id, ticker, shares, broker_name");

  if (holdingsError) {
    return NextResponse.json({ error: holdingsError.message }, { status: 500 });
  }

  const tickers = [...new Set((holdings ?? []).map((h) => h.ticker))];
  const provider = getDividendDataProvider();

  // One Plaid fetch per user for the whole run, not one per payment. The
  // loop below is nested (events x holdings), so querying inside it meant
  // re-fetching the same few days of investment transactions dozens of
  // times for a single user — a rate-limit risk and a billable one. The
  // promise is cached, not the result, so concurrent lookups for the same
  // user share one in-flight request.
  const brokerDividendsByUser = new Map<string, Promise<BrokerDividendIndex>>();
  function brokerDividendsFor(userId: string): Promise<BrokerDividendIndex> {
    let pending = brokerDividendsByUser.get(userId);
    if (!pending) {
      pending = loadBrokerDividends(userId);
      brokerDividendsByUser.set(userId, pending);
    }
    return pending;
  }

  const tickerErrors: { ticker: string; error: string }[] = [];
  let eventsUpserted = 0;
  let paymentsInserted = 0;
  let notificationsRetried = 0;

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

      const eventsInWindow = (upserted ?? []).filter((e) => e.pay_date >= windowStart && e.pay_date <= today);
      if (eventsInWindow.length === 0) continue;

      const holdingsForTicker = (holdings ?? []).filter((h) => h.ticker === ticker);

      for (const event of eventsInWindow) {
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
            .select("id, notified_at")
            .single();

          let payment = inserted;

          if (insertError) {
            // Anything other than a unique violation is a real failure.
            if (insertError.code !== "23505") {
              tickerErrors.push({ ticker, error: insertError.message });
              continue;
            }

            // 23505 = unique_violation — a previous run already recorded
            // this payment. That is the expected path now that the
            // detection window spans several days and therefore re-visits
            // the same event on consecutive runs. It does NOT prove the
            // notification was ever delivered though: a push/Telegram
            // failure leaves notified_at null, and the old code bailed out
            // here unconditionally, so such a payment could never be
            // retried — the insert kept failing for the rest of time.
            // Re-read the row and fall through to notify only when it
            // genuinely never went out.
            const { data: existing } = await supabase
              .from("dividend_payments")
              .select("id, notified_at")
              .eq("holding_id", holding.id)
              .eq("dividend_event_id", event.id)
              .single();

            if (!existing || existing.notified_at) continue;

            payment = existing;
            notificationsRetried += 1;
          } else {
            paymentsInserted += 1;
          }

          // Deliberately two independent queries, not one combined select.
          // PostgREST fails the *entire* row when any requested column
          // doesn't exist yet (verified live: `column
          // profiles.notification_style does not exist` — a hard error,
          // not a null field) — until migration 20260801070000 is applied,
          // a combined query would return profile: null and silently take
          // isPro down with it, stopping Telegram alerts for every Pro
          // user. Splitting them means a not-yet-applied migration can
          // only ever cost the new feature its default, never break the
          // already-shipped one next to it.
          const { data: planRow } = await supabase.from("profiles").select("plan").eq("id", holding.user_id).single();
          const isPro = planRow?.plan === "pro" || planRow?.plan === "pro_plus";

          const { data: styleRow } = await supabase
            .from("profiles")
            .select("notification_style")
            .eq("id", holding.user_id)
            .single();
          const notificationStyle = (styleRow?.notification_style as NotificationStyle) ?? "compact";

          // Only ever true for Pro+ users with an active Plaid connection —
          // see lib/notifications/plaid-confirmation.ts. buildNotificationContent
          // degrades "premium" to the descriptive copy rather than fabricate
          // a confirmation when this is false.
          const brokerConfirmed = (await brokerDividendsFor(holding.user_id)).confirms(ticker, amount);
          const content = buildNotificationContent(notificationStyle, {
            ticker,
            amount,
            brokerName: holding.broker_name,
            brokerConfirmed,
          });

          const { data: subscriptions } = await supabase
            .from("push_subscriptions")
            .select("id, fcm_token")
            .eq("user_id", holding.user_id);

          let anySent = false;
          const channelsNotified: string[] = [];

          for (const subscription of subscriptions ?? []) {
            const result = await sendPush(subscription.fcm_token, content.push.title, content.push.body);
            if (result.sent) {
              anySent = true;
            } else if (result.staleToken) {
              await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
            }
          }
          if (anySent) channelsNotified.push("push");

          // Telegram alerts are Pro/Pro+ only (ARCHITECTURE.md §7) — the
          // plan check happens here, server-side via the service-role
          // client, same reasoning as the Free-plan holdings cap
          // (ARCHITECTURE.md §10: never trust a client-visible flag alone
          // for anything that gates a paid feature). Matching gate is in
          // app/(dashboard)/settings/page.tsx (isPro).
          if (isPro) {
            const { data: telegramLink } = await supabase
              .from("telegram_links")
              .select("chat_id")
              .eq("user_id", holding.user_id)
              .not("chat_id", "is", null)
              .maybeSingle();

            if (telegramLink?.chat_id) {
              const result = await sendTelegramMessage(telegramLink.chat_id, content.telegram);
              if (result.sent) {
                channelsNotified.push("telegram");
              } else if (result.chatInvalid) {
                await supabase.from("telegram_links").update({ chat_id: null, linked_at: null }).eq("user_id", holding.user_id);
              }
            }
          }

          // Left null when every channel failed, which is what makes the
          // next run pick this payment up again as a retry.
          if (channelsNotified.length > 0 && payment) {
            await supabase
              .from("dividend_payments")
              .update({ notified_at: new Date().toISOString(), notified_channels: channelsNotified })
              .eq("id", payment.id);
          }
        }
      }
    } catch (err) {
      tickerErrors.push({ ticker, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    window: { start: windowStart, end: today },
    tickersChecked: tickers.length,
    eventsUpserted,
    paymentsInserted,
    notificationsRetried,
    errors: tickerErrors,
  });
}
