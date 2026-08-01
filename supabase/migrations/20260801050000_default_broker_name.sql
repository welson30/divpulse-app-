-- Replaces Settings' Language selector, which was dead weight: `locale`
-- is stored but nothing in the app actually reads it to translate or
-- reformat anything (no i18n layer exists). default_broker_name is real —
-- it pre-fills AddHoldingForm's optional broker field, saving the retype
-- for the common case of a user holding everything at one broker.
alter table public.profiles
  add column default_broker_name text;
