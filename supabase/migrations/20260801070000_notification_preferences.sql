-- Notification style (Compact/Descriptive/Premium) and the in-app
-- notification bell's read cursor. Plain text + check constraint, matching
-- calendar_privacy_mode/currency's style rather than the enum style used
-- for plan_tier.

alter table public.profiles
  add column notification_style text not null default 'compact'
  check (notification_style in ('compact', 'descriptive', 'premium'));

-- "Unread" is derived as dividend_payments.notified_at > this cursor,
-- rather than a per-notification read flag — a single timestamp per user
-- is enough to answer "is there anything new since I last opened the
-- bell," and avoids a second table just to track read state on rows this
-- app already writes. Defaults to now() so shipping this doesn't retroactively
-- mark every existing user's notification history as unread.
alter table public.profiles
  add column notifications_last_seen_at timestamptz not null default now();
