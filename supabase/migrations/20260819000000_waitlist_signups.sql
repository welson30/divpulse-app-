-- PaidPrime — waitlist_signups
-- Backs the email capture on the public coming-soon gate (app/page.tsx).
-- Unlike every other table here there is no user_id: the whole point is
-- that these people don't have accounts yet, so rows aren't owned by
-- anyone and the usual `auth.uid() = user_id` RLS shape doesn't apply.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- Where the address came from, so a later campaign can tell the
  -- coming-soon gate apart from any other capture point added later.
  source text not null default 'coming_soon',
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: someone re-submitting as Foo@Bar.com after
-- foo@bar.com is the same person, and a plain `unique (email)` would let
-- both through and mail them twice.
create unique index waitlist_signups_email_key on public.waitlist_signups (lower(email));

create index waitlist_signups_created_at_idx on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

-- Deliberately NO policies. RLS with zero policies denies everything to
-- `anon` and `authenticated`, which is what we want: the address list must
-- not be readable by visitors, and a public insert policy would let anyone
-- flood the table straight from the browser using the anon key.
--
-- Writes go through the service-role client instead (lib/supabase/admin.ts,
-- which bypasses RLS) from a server action, so the insert is rate-limitable
-- and validated server-side. Read the list from the Supabase dashboard, or
-- add a policy scoped to a specific admin role if that's ever needed.
