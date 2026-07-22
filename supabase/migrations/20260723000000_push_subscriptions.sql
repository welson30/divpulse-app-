-- PaidPrime — push_subscriptions
-- Replaces OneSignal's hosted subscriber directory after its Web SDK
-- proved unable to complete a TLS handshake to api.onesignal.com from
-- Pakistani networks (persistent net::ERR_CONNECTION_CLOSED — see project
-- history). We now own subscription storage directly: one row per
-- browser/device FCM token, since a single user can have several (phone,
-- laptop, multiple browsers).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  fcm_token text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fcm_token)
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: select own rows"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions: insert own rows"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions: update own rows"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions: delete own rows"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- No client insert/update/delete policy for the detection job's send
-- path — sends are read-only against this table (SELECT fcm_token WHERE
-- user_id = ...) via the service-role client, same pattern as
-- dividend_payments. Tokens are written by the signed-in user's own
-- browser (upsert on fcm_token) via a normal RLS-scoped insert, which the
-- policies above already allow.
