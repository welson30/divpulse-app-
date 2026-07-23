-- PaidPrime — collections
-- Ports ARCHITECTURE.md §7's `collections` / `collection_tickers` tables.
-- Admin-curated groupings (e.g. "REITs", "High Yield") shown on the
-- Collections page with live Yahoo Finance prices/yields — not
-- user-writable, so RLS only grants select, and all writes go through
-- the service-role key (see lib/supabase/admin.ts).

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_tickers (
  collection_id uuid not null references public.collections (id) on delete cascade,
  ticker text not null,
  sort_order integer not null default 0,
  primary key (collection_id, ticker)
);

alter table public.collections enable row level security;
alter table public.collection_tickers enable row level security;

create policy "collections: public read"
  on public.collections for select
  using (true);

create policy "collection_tickers: public read"
  on public.collection_tickers for select
  using (true);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Starter list — proposed, not final. Well-known, liquid dividend payers
-- grouped into three common income-investor categories. Swap or extend
-- freely; nothing downstream depends on these specific tickers.
-- ---------------------------------------------------------------------
insert into public.collections (name, category, description, sort_order) values
  ('REITs', 'Real Estate', 'Real estate investment trusts — required to distribute most taxable income as dividends.', 1),
  ('High Yield', 'Income', 'Higher-yielding names across sectors, popular with income-focused investors.', 2),
  ('BDCs', 'Business Development', 'Business development companies — lend to and invest in mid-market private companies.', 3);

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('O', 1), ('SPG', 2), ('PLD', 3), ('VICI', 4), ('AVB', 5)
) as t(ticker, sort_order)
where collections.name = 'REITs';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('JEPI', 1), ('JEPQ', 2), ('SCHD', 3), ('VYM', 4), ('KO', 5)
) as t(ticker, sort_order)
where collections.name = 'High Yield';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('MAIN', 1), ('ARCC', 2), ('HTGC', 3)
) as t(ticker, sort_order)
where collections.name = 'BDCs';
