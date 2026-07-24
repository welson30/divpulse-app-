-- PaidPrime — pg_cron dividend detection scheduler
-- Alternative to Vercel Cron (vercel.json), which on the Hobby plan only
-- guarantees a 1-hour execution window rather than an exact time — hard
-- to verify and not precise enough while actively testing. pg_cron runs
-- inside Supabase's own Postgres instance and fires at the exact minute
-- specified, independent of Vercel's plan tier.
--
-- Requires the pg_cron and pg_net extensions (pg_net provides
-- net.http_get/net.http_post for calling out to an external HTTPS
-- endpoint from inside Postgres). Both are available on all Supabase
-- plans, enabled per-project.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Calls the same /api/jobs/detect-dividends route Vercel Cron was
-- calling, with the same CRON_SECRET bearer-token auth
-- (app/api/jobs/detect-dividends/route.ts checks this — no route code
-- changes needed to support this second scheduler). Uses net.http_get,
-- not net.http_post — the route only exports a GET handler (matching
-- Vercel Cron's own convention of GET-ing the path); the first version
-- of this migration used http_post and got a 405 back (confirmed via
-- select * from net._http_response), which is how this comment came to
-- exist.
--
-- The secret is embedded directly in the cron.schedule call below rather
-- than read from a Postgres setting, since pg_cron jobs run as stored,
-- static SQL — there's no environment-variable equivalent inside
-- Postgres. This value must be kept in sync with CRON_SECRET in .env /
-- Vercel's env vars if it's ever rotated.
select cron.schedule(
  'detect-dividends-daily',
  '0 6 * * *',
  $$
  select net.http_get(
    url := 'https://www.paidprime.com/api/jobs/detect-dividends',
    headers := jsonb_build_object(
      'Authorization', 'Bearer fdef94cee6a5393d4704730e33514e56307cbf7a174081f909e09744ee62aa20'
    )
  );
  $$
);
