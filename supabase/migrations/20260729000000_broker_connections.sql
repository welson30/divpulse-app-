-- PaidPrime — broker_connections
-- Ports ARCHITECTURE.md §7's `broker_connections` table. Plaid Item
-- state, Pro+ only. plaid_access_token is stored encrypted at rest
-- (AES-256-GCM via lib/crypto/encryption.ts) per PRD §8 — this table
-- never holds a plaintext token, and is never read from the client
-- (RLS grants select for UI display of institution/status only; the
-- actual decrypt happens exclusively in server code via the service-role
-- client, same trust boundary as SUPABASE_SERVICE_ROLE_KEY itself).

create type public.broker_connection_status as enum ('active', 'error', 'disconnected');

create table public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plaid_item_id text not null unique,
  plaid_access_token text not null,
  institution_name text,
  status public.broker_connection_status not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index broker_connections_user_id_idx on public.broker_connections (user_id);

alter table public.broker_connections enable row level security;

-- Select-only for the owning user — lets Settings show "Connected to
-- Fidelity, last synced 2h ago" without exposing the encrypted token
-- value being meaningful to a client anyway (it's useless without
-- ENCRYPTION_KEY, which never leaves the server).
create policy "broker_connections: select own rows"
  on public.broker_connections for select
  using (auth.uid() = user_id);

-- No client insert/update/delete — connections are created by
-- app/api/plaid/exchange-token/route.ts and synced/disconnected by
-- server-only code, exclusively via the service-role client. A user
-- disconnecting a broker goes through a server action that checks
-- ownership itself, not a client-writable RLS policy.

create trigger broker_connections_set_updated_at
  before update on public.broker_connections
  for each row execute function public.set_updated_at();
