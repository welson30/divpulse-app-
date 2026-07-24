-- PaidPrime — goals
-- Ports ARCHITECTURE.md §7's `goals` table. One row per user per
-- goal_type — a user has at most one Passive Income goal, one Emergency
-- Reserve goal, one Financial Freedom goal at a time (unique constraint
-- below), matching the prototype's three-tab Goals page (one set of
-- inputs per tab, not a list of arbitrary goals).
--
-- monthly_expenses, months_target, and current_amount are only
-- meaningful for emergency_reserve (target_amount = monthly_expenses *
-- months_target, computed app-side rather than stored redundantly) —
-- nullable and unused by the other two goal_types. current_amount is a
-- manually-entered balance (like a savings account figure the user types
-- in themselves) — there's no way to derive "money actually set aside"
-- from portfolio data, since confirmed dividend income may have already
-- been spent or reinvested rather than saved.

create type public.goal_type as enum ('passive_income', 'emergency_reserve', 'financial_freedom');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_type public.goal_type not null,
  target_amount numeric not null check (target_amount > 0),
  monthly_contribution numeric not null default 0 check (monthly_contribution >= 0),
  monthly_expenses numeric check (monthly_expenses > 0),
  months_target integer check (months_target > 0),
  current_amount numeric check (current_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, goal_type)
);

create index goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

create policy "goals: select own rows"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals: insert own rows"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals: update own rows"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals: delete own rows"
  on public.goals for delete
  using (auth.uid() = user_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ai_advisor_queries: usage log for the pay-per-query AI provider
-- (ARCHITECTURE.md §7/§12 — "needed for cost control regardless of which
-- provider wins"). Also backs the per-day rate limit enforced in
-- app/api/advisor/query/route.ts (counts today's rows for the user).
-- ---------------------------------------------------------------------
create table public.ai_advisor_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  response text,
  created_at timestamptz not null default now()
);

create index ai_advisor_queries_user_id_created_at_idx on public.ai_advisor_queries (user_id, created_at);

alter table public.ai_advisor_queries enable row level security;

create policy "ai_advisor_queries: select own rows"
  on public.ai_advisor_queries for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy — written exclusively by
-- app/api/advisor/query/route.ts via the service-role client, so a
-- client can't forge query rows to inflate/evade its own rate limit.
