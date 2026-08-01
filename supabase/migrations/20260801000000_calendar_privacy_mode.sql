-- Calendar privacy filter — lets a user hide ticker identity or dollar
-- amounts on the dividend calendar (e.g. while recording demo videos of
-- a real portfolio). Plain text + check constraint, matching currency/
-- locale's style rather than the enum style used for plan_tier.

alter table public.profiles
  add column calendar_privacy_mode text not null default 'full'
  check (calendar_privacy_mode in ('full', 'amount_only', 'ticker_only'));
