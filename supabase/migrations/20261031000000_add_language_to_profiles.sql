-- Add language preference to profiles.
-- The detect-dividends job queries notification_style and language in the
-- same PostgREST call. PostgREST returns an error (not null) for an entire
-- row when any requested column doesn't exist, so without this column the
-- job silently falls back to the defaults for BOTH fields — compact style
-- and English — regardless of what the user has saved.

alter table public.profiles
  add column if not exists language text not null default 'en'
  check (language in ('en', 'pt'));
