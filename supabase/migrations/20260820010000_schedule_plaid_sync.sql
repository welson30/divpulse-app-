-- PaidPrime — schedule the Plaid holdings resync
--
-- app/api/jobs/sync-plaid-holdings/route.ts has existed since the broker
-- integration landed but was never scheduled anywhere ("not wired into a
-- specific schedule here"), so Plaid-sourced holdings only ever refreshed
-- when a user pressed Sync now. A buy or sell at the broker went
-- unnoticed indefinitely, which in turn means dividend detection was
-- computing payments from stale share counts.
--
-- Same pg_cron + net.http_get shape as
-- 20260731010000_dst_safe_dividend_detection.sql.
--
-- 14:30 UTC, i.e. 30 minutes ahead of detect-dividends at 15:00, so the
-- detection job reads holdings that were refreshed the same morning
-- rather than yesterday's. Both sit after the US market open in either
-- half of the year (13:30 UTC in EDT, 14:30 UTC in EST) — see the DST
-- migration for why that boundary matters. Plaid itself refreshes
-- investment holdings at least once per market day, overnight after
-- close, so a daily pull is aligned with how often the data can change.
select cron.unschedule('sync-plaid-holdings-daily')
where exists (select 1 from cron.job where jobname = 'sync-plaid-holdings-daily');

select cron.schedule(
  'sync-plaid-holdings-daily',
  '30 14 * * *',
  $$
  select net.http_get(
    url := 'https://www.paidprime.com/api/jobs/sync-plaid-holdings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer fdef94cee6a5393d4704730e33514e56307cbf7a174081f909e09744ee62aa20'
    )
  );
  $$
);
