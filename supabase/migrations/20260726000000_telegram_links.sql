-- PaidPrime — telegram_links
-- Per-user Telegram chat linking (ARCHITECTURE.md §9.4), using the flow
-- the client supplied: a "Connect Telegram" button opens
-- t.me/PaidPrimeBot?start=<code>, which Telegram passes through to the
-- bot as `/start <code>` — the webhook (app/api/telegram/webhook) reads
-- that code to know which app user the resulting chat_id belongs to.
-- Without a code, Telegram's webhook has no way to attribute a /start to
-- a specific PaidPrime account.

create table public.telegram_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  link_code text not null unique,
  chat_id bigint,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

create index telegram_links_link_code_idx on public.telegram_links (link_code);

alter table public.telegram_links enable row level security;

create policy "telegram_links: select own row"
  on public.telegram_links for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy — the linking code is generated
-- server-side (Server Action using the user's own session, still fine
-- under RLS since it's their own row) and chat_id is written exclusively
-- by the webhook via the service-role client, matching the
-- push_subscriptions / dividend_payments pattern of "never trust a
-- client-writable path for anything a background job later reads".
create policy "telegram_links: insert own row"
  on public.telegram_links for insert
  with check (auth.uid() = user_id);

create policy "telegram_links: delete own row"
  on public.telegram_links for delete
  using (auth.uid() = user_id);
