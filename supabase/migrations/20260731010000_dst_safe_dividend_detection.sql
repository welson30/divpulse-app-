-- PaidPrime — shift dividend detection to 15:00 UTC so it survives DST
--
-- Follows 20260731000000_reschedule_dividend_detection.sql, which moved
-- the job from 06:00 to 14:00 UTC. That fixed the summer case but would
-- have quietly re-broken every winter, because pg_cron schedules in UTC
-- while the US market open is fixed to 9:30 AM *local* Eastern:
--
--   EDT (Mar-Nov, UTC-4): market open 9:30 ET = 13:30 UTC
--   EST (Nov-Mar, UTC-5): market open 9:30 ET = 14:30 UTC
--
-- A 14:00 UTC job therefore runs 30 min AFTER open in summer (fine) but
-- 30 min BEFORE it in winter — landing back in the exact failure mode
-- this whole fix addressed, where the job looks for a dividend Yahoo has
-- not published yet. The trailing detection window
-- (DETECTION_WINDOW_DAYS in app/api/jobs/detect-dividends/route.ts) would
-- still catch it on the following run, so the winter symptom would have
-- been "alerts arrive a day late" rather than "never" — subtle enough to
-- go unnoticed for a while, which is exactly why it is worth pre-empting.
--
-- 15:00 UTC clears market open in both halves of the year and still lands
-- in the user's morning either way:
--
--   EDT: 15:00 UTC = 11:00 AM ET (1h30m after open)
--   EST: 15:00 UTC = 10:00 AM ET (0h30m after open)
--
-- A new migration rather than an edit to the previous one, which has
-- already been applied to production.
select cron.unschedule('detect-dividends-daily')
where exists (select 1 from cron.job where jobname = 'detect-dividends-daily');

select cron.schedule(
  'detect-dividends-daily',
  '0 15 * * *',
  $$
  select net.http_get(
    url := 'https://www.paidprime.com/api/jobs/detect-dividends',
    headers := jsonb_build_object(
      'Authorization', 'Bearer fdef94cee6a5393d4704730e33514e56307cbf7a174081f909e09744ee62aa20'
    )
  );
  $$
);
