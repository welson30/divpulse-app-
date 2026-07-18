-- PaidPrime — holdings
-- Ports ARCHITECTURE.md §7's `holdings` table. Depends on `profiles`
-- (20260717000000_profiles_and_subscriptions.sql) for the user_id FK and
-- the plan-cap check.

create type public.holding_source as enum ('manual', 'csv', 'plaid');

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticker text not null,
  company_name text,
  shares numeric not null check (shares > 0),
  broker_name text,
  source public.holding_source not null default 'manual',
  plaid_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index holdings_user_id_idx on public.holdings (user_id);

alter table public.holdings enable row level security;

create policy "holdings: select own rows"
  on public.holdings for select
  using (auth.uid() = user_id);

create policy "holdings: insert own rows"
  on public.holdings for insert
  with check (auth.uid() = user_id);

create policy "holdings: update own rows"
  on public.holdings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "holdings: delete own rows"
  on public.holdings for delete
  using (auth.uid() = user_id);

create trigger holdings_set_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Free-plan 5-asset cap — enforced here as defense-in-depth alongside the
-- server action's own check (ARCHITECTURE.md §10: "never trust a
-- client-side check alone for anything that gates cost"). A trigger
-- means the cap holds even if a future code path inserts directly.
-- ---------------------------------------------------------------------
create function public.enforce_holdings_plan_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan public.plan_tier;
  holding_count integer;
begin
  select plan into user_plan from public.profiles where id = new.user_id;

  if user_plan = 'free' then
    select count(*) into holding_count from public.holdings where user_id = new.user_id;
    if holding_count >= 5 then
      raise exception 'Free plan is limited to 5 tracked assets. Upgrade to Pro for unlimited manual tracking.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger holdings_enforce_plan_cap
  before insert on public.holdings
  for each row execute function public.enforce_holdings_plan_cap();
