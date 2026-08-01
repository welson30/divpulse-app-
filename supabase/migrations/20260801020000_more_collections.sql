-- PaidPrime — more curated collections
-- Adds four more admin-curated categories on top of the original REITs /
-- High Yield / BDCs set (20260725000000_collections.sql), matching how
-- other dividend trackers (Simply Safe Dividends, dividend.com) group
-- stocks: Dividend Kings (50+ yr streaks), monthly payers, utilities and
-- dividend-paying tech. Same admin-only, public-read model — no RLS
-- changes needed, the existing "collections: public read" / "collection_
-- tickers: public read" policies already cover these new rows.
--
-- Starter list — proposed, not final, same as the original seed. O and
-- MAIN are intentionally cross-listed with REITs/BDCs (realistic: a
-- ticker can belong to more than one curated theme).

insert into public.collections (name, category, description, sort_order) values
  ('Dividend Kings', 'Dividend Growth', '50+ consecutive years of dividend increases — the market''s longest, most resilient payout streaks.', 4),
  ('Monthly Dividend Payers', 'Income', 'Pay dividends every month instead of quarterly — steadier cash flow for income investors.', 5),
  ('Utilities', 'Utilities', 'Regulated utility companies — steady, defensive dividend payers with low volatility.', 6),
  ('Tech Dividend Payers', 'Technology', 'Established technology companies pairing dividend growth with capital appreciation.', 7);

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('KO', 1), ('PG', 2), ('MMM', 3), ('EMR', 4), ('CL', 5)
) as t(ticker, sort_order)
where collections.name = 'Dividend Kings';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('O', 1), ('MAIN', 2), ('STAG', 3), ('AGNC', 4), ('GAIN', 5)
) as t(ticker, sort_order)
where collections.name = 'Monthly Dividend Payers';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('DUK', 1), ('SO', 2), ('NEE', 3), ('D', 4), ('AEP', 5)
) as t(ticker, sort_order)
where collections.name = 'Utilities';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('AAPL', 1), ('MSFT', 2), ('AVGO', 3), ('TXN', 4), ('CSCO', 5)
) as t(ticker, sort_order)
where collections.name = 'Tech Dividend Payers';
