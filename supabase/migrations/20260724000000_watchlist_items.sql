-- PaidPrime — watchlist_items
-- Ports ARCHITECTURE.md §7's `watchlist_items` table. Assets a user tracks
-- but doesn't hold — same RLS shape as holdings, no shares/broker fields
-- since nothing is actually owned yet.

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticker text not null,
  company_name text,
  added_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index watchlist_items_user_id_idx on public.watchlist_items (user_id);

alter table public.watchlist_items enable row level security;

create policy "watchlist_items: select own rows"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "watchlist_items: insert own rows"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "watchlist_items: delete own rows"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);

-- No update policy — a watchlist row is either present or not, there's
-- nothing on it worth editing in place (remove + re-add covers renames).
