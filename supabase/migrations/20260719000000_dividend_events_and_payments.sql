-- PaidPrime — dividend_events + dividend_payments
-- Ports ARCHITECTURE.md §7's `dividend_events` and `dividend_payments`
-- tables, and §9.1's idempotency requirement ("no missed notifications on
-- service restarts" — re-running the detection job must never
-- double-notify). Depends on `holdings` (20260718000000_holdings.sql).

-- ---------------------------------------------------------------------
-- dividend_events: market-level cache, NOT user-specific — one row per
-- ticker/pay-date, shared across every user who holds that ticker.
-- Populated by the daily detection job from Yahoo Finance.
-- ---------------------------------------------------------------------
create table public.dividend_events (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  ex_date date,
  pay_date date not null,
  amount_per_share numeric not null check (amount_per_share > 0),
  source text not null default 'yahoo_finance',
  fetched_at timestamptz not null default now(),
  unique (ticker, pay_date)
);

create index dividend_events_ticker_idx on public.dividend_events (ticker);
create index dividend_events_pay_date_idx on public.dividend_events (pay_date);

alter table public.dividend_events enable row level security;

-- Shared reference data, not user-scoped — every authenticated user can
-- read it (a user needs to see dividend history for tickers on their
-- Watchlist too, not just their own holdings). Writes happen exclusively
-- via the service-role client in the detection job
-- (lib/supabase/admin.ts), never from an authenticated user's session —
-- there is deliberately no insert/update/delete policy here.
create policy "dividend_events: authenticated read"
  on public.dividend_events for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- dividend_payments: per-user realized payout log — dashboard history AND
-- the notification-dedup ledger. The unique constraint on
-- (holding_id, dividend_event_id) is the actual idempotency boundary: the
-- detection job can be re-run after a crash and will never insert a
-- second row (and therefore never send a second notification) for a
-- payment it already processed.
-- ---------------------------------------------------------------------
create table public.dividend_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  holding_id uuid not null references public.holdings (id) on delete cascade,
  dividend_event_id uuid not null references public.dividend_events (id) on delete cascade,
  amount numeric not null,
  pay_date date not null,
  notified_at timestamptz,
  notified_channels text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (holding_id, dividend_event_id)
);

create index dividend_payments_user_id_idx on public.dividend_payments (user_id);
create index dividend_payments_pay_date_idx on public.dividend_payments (pay_date);

alter table public.dividend_payments enable row level security;

create policy "dividend_payments: select own rows"
  on public.dividend_payments for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy — written exclusively by the
-- detection job via the service-role client, same reasoning as
-- `subscriptions` (never trust a client-side path for anything that
-- drives a paid notification send).
