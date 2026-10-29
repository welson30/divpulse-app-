-- Allow 'discreet' as a valid notification_style value.
-- The original constraint only covered compact/descriptive/premium;
-- dropping and re-adding with the full set is the standard PG approach
-- since ALTER TABLE ... ADD CHECK does not replace an existing one.

alter table public.profiles
  drop constraint if exists profiles_notification_style_check;

alter table public.profiles
  add constraint profiles_notification_style_check
  check (notification_style in ('compact', 'descriptive', 'premium', 'discreet'));
