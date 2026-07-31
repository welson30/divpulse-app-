-- PaidPrime — move dividend detection to after the US market open
--
-- The original schedule (20260727000000_pg_cron_dividend_detection.sql)
-- fired at 06:00 UTC. That turned out to be structurally too early to
-- ever detect a payout on the day it happens: Yahoo only publishes a
-- dividend into its chart feed at the ex-date's market open, timestamped
-- 13:30 UTC (verified directly against the raw endpoint — every dividend
-- event for QDTE/XDTE/RDTE/NVDY/TSLY carries exactly 13:30:00Z). The job
-- was therefore checking for "today's" dividends 7.5 hours before Yahoo
-- could possibly have them, finding nothing, and then skipping them
-- forever once the date rolled over on the next run.
--
-- Evidence from production on 2026-07-31: five events dated 2026-07-30
-- had fetched_at = 2026-07-31T06:00Z, i.e. first seen a full day late,
-- and the only two dividend_payments rows in the entire database were
-- created by a manual 22:25 UTC run — never by the scheduled cron.
--
-- 14:00 UTC (10:00 ET) leaves a 30-minute margin after the publish time
-- while still landing the notification during the client's morning. The
-- route's trailing detection window (DETECTION_WINDOW_DAYS in
-- app/api/jobs/detect-dividends/route.ts) remains the safety net for any
-- instrument that publishes later in the day or for a skipped run.
--
-- Guarded so this migration is safe to run against a database where the
-- original job was never created — plain cron.unschedule() raises if the
-- job name doesn't exist.
select cron.unschedule('detect-dividends-daily')
where exists (select 1 from cron.job where jobname = 'detect-dividends-daily');

-- Same endpoint, same CRON_SECRET bearer auth, same net.http_get (the
-- route only exports a GET handler) as the original migration — the only
-- change is the hour. Keep this secret in sync with CRON_SECRET in .env /
-- Vercel if it is ever rotated.
select cron.schedule(
  'detect-dividends-daily',
  '0 14 * * *',
  $$
  select net.http_get(
    url := 'https://www.paidprime.com/api/jobs/detect-dividends',
    headers := jsonb_build_object(
      'Authorization', 'Bearer fdef94cee6a5393d4704730e33514e56307cbf7a174081f909e09744ee62aa20'
    )
  );
  $$
);
