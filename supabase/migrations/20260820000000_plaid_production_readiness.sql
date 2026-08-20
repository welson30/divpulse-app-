-- PaidPrime — Plaid production readiness
--
-- Adds the state the integration needs before it can face real
-- institutions instead of Sandbox's fake banks:
--
--   1. Re-authentication state. Real bank logins expire every few months
--      (Plaid signals this as ITEM_LOGIN_REQUIRED / PENDING_EXPIRATION /
--      PENDING_DISCONNECT). Until now nothing recorded that, so a dead
--      connection was indistinguishable from a transient sync failure and
--      there was no way back other than disconnect-and-start-over.
--   2. A real owning connection on each Plaid-sourced holding, which is
--      what stops the same portfolio being counted twice.
--   3. Somewhere to record positions Plaid returned that we could not map
--      to a ticker, so they can be named in the UI rather than silently
--      dropped.

alter table public.broker_connections
  -- Plaid's institution_id (ins_127287 etc). The display name was already
  -- stored, but update mode and any per-institution handling key off the
  -- ID, and Link only hands it to us once, at connection time.
  add column plaid_institution_id text,
  -- Set by the webhook (or by a sync that hits the same error) when the
  -- user must re-authenticate through Link's update mode. Distinct from
  -- status='error': an error can be transient and clears on the next
  -- successful sync, whereas this needs the human to do something.
  add column needs_reauth boolean not null default false,
  -- The Plaid error_code behind the current state, for support and so the
  -- UI can distinguish "log in again" from "consent expired".
  add column last_error_code text,
  -- [{ name, quantity, security_id }] — holdings Plaid reported with no
  -- ticker_symbol (some mutual funds, treasuries, proprietary sweep
  -- vehicles). These are real money and used to vanish without a trace;
  -- recorded here so the Brokers page can say which ones didn't come
  -- across instead of quietly under-reporting the portfolio.
  add column unmatched_positions jsonb not null default '[]'::jsonb;

-- Which connection produced this holding. The prior sync deleted rows by
-- the plaid_account_id values present in the *current* Plaid response,
-- which silently fails whenever those IDs change — a second Item, or a
-- reconnect after an error, inserts a duplicate set instead of replacing
-- the old one. Verified live: one test account held 9 unique positions as
-- 18 rows across 2 connections, inflating the portfolio and the
-- allocation chart. Deleting by connection makes the replace exact.
--
-- on delete cascade: removing a connection row should take its synced
-- holdings with it. Manual and CSV holdings have a null value here and
-- are never touched by Plaid sync.
alter table public.holdings
  add column broker_connection_id uuid references public.broker_connections (id) on delete cascade;

create index holdings_broker_connection_id_idx on public.holdings (broker_connection_id);

-- Best-effort backfill, deliberately limited to users with exactly one
-- live connection — that is the only case where the mapping is knowable
-- from the data we have, since plaid_account_id was never associated with
-- a connection anywhere. Users with several connections keep null values
-- and are handled by the transitional branch in lib/plaid/sync.ts, which
-- also matches legacy rows on plaid_account_id until each connection has
-- synced once under the new scheme.
update public.holdings h
set broker_connection_id = bc.id
from public.broker_connections bc
where h.source = 'plaid'
  and h.broker_connection_id is null
  and bc.user_id = h.user_id
  and bc.status <> 'disconnected'
  and (
    select count(*)
    from public.broker_connections b2
    where b2.user_id = h.user_id
      and b2.status <> 'disconnected'
  ) = 1;
