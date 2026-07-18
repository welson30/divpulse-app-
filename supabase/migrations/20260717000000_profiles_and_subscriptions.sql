-- DivPulse — profiles + subscriptions foundation
-- Ports ARCHITECTURE.md §7's `profiles` and `subscriptions` tables. Every
-- later migration (holdings, dividend_events, etc.) depends on `profiles`
-- existing first, since every user-scoped table's RLS policy checks
-- auth.uid() against a user_id that ultimately traces back here.

create type public.plan_tier as enum ('free', 'pro', 'pro_plus');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- ---------------------------------------------------------------------
-- profiles: app-level user profile layered on auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  currency text not null default 'USD',
  locale text not null default 'en',
  plan public.plan_tier not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own row"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/delete policy for authenticated users — profile rows are
-- created exclusively by the handle_new_user trigger below (service-role
-- context via the trigger's SECURITY DEFINER), not client-writable.

-- Auto-create a profile row the moment a new auth.users row appears, so
-- the app never has to remember to do this after signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- subscriptions: mirrors Stripe subscription state, source of truth for
-- plan-gated feature checks everywhere else in the app.
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan public.plan_tier not null default 'free',
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own row"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy — subscriptions are written only
-- by the Stripe webhook handler via the service-role client
-- (lib/supabase/admin.ts), never directly by the signed-in user. This is
-- the enforcement point for "never trust a client-side check alone for
-- anything that gates cost" (ARCHITECTURE.md §10).

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
