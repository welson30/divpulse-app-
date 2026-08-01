-- PaidPrime — more curated collections (round 2)
-- Adds seven more admin-curated categories on top of the existing seven
-- (20260725000000_collections.sql, 20260801020000_more_collections.sql).
-- Every ticker below was verified live against Yahoo Finance quotes
-- 2026-08-01 (real symbol, resolves to a name/price) before being added —
-- same discipline as every other data claim in this app, applied to
-- curated admin data too. Categories/groupings researched against
-- Sure Dividend, Simply Safe Dividends and Dividend.com's own taxonomy
-- for how dividend-tracking sites split things up.
--
-- "Options Income" is deliberately its own category, not folded into the
-- existing "Income" (High Yield / Monthly Dividend Payers) — covered-call
-- ETFs (QDTE, XDTE, JEPI, JEPQ, QQQI) earn their yield from derivatives
-- premium, not company dividends, a meaningfully different risk/return
-- profile worth its own visual grouping.
--
-- Starter list — proposed, not final, same as every earlier seed.
-- Cross-listing with existing collections (JEPI/JEPQ already in "High
-- Yield") is intentional, same as O appearing in both REITs and Monthly
-- Dividend Payers already.

insert into public.collections (name, category, description, sort_order) values
  ('Dividend Aristocrats', 'Dividend Growth', 'S&P 500 members with 25+ consecutive years of dividend increases — one tier below the 50-year Dividend Kings.', 8),
  ('Options Income ETFs', 'Options Income', 'Covered-call and derivatives-income funds — high yield from options premium, not company dividends.', 9),
  ('Healthcare Dividend Payers', 'Healthcare', 'Pharmaceutical and healthcare companies combining defensive demand with steady payouts.', 10),
  ('Financial Dividend Payers', 'Financials', 'Major banks and asset managers — dividend payouts tied to interest rates and credit cycles.', 11),
  ('Energy Dividend Payers', 'Energy', 'Oil, gas and refining companies — cyclical payouts backed by commodity cash flow.', 12),
  ('Consumer Staples', 'Consumer Staples', 'Household names people buy in any economy — defensive, low-volatility dividend payers.', 13),
  ('Industrial Dividend Payers', 'Industrials', 'Manufacturing and industrial conglomerates pairing dividend growth with economic-cycle exposure.', 14);

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('MCD', 1), ('PEP', 2), ('LOW', 3), ('SHW', 4), ('ITW', 5)
) as t(ticker, sort_order)
where collections.name = 'Dividend Aristocrats';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('QDTE', 1), ('XDTE', 2), ('JEPQ', 3), ('JEPI', 4), ('QQQI', 5)
) as t(ticker, sort_order)
where collections.name = 'Options Income ETFs';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('JNJ', 1), ('ABBV', 2), ('PFE', 3), ('MRK', 4), ('ABT', 5)
) as t(ticker, sort_order)
where collections.name = 'Healthcare Dividend Payers';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('JPM', 1), ('BAC', 2), ('WFC', 3), ('USB', 4), ('TFC', 5)
) as t(ticker, sort_order)
where collections.name = 'Financial Dividend Payers';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('XOM', 1), ('CVX', 2), ('COP', 3), ('EOG', 4), ('PSX', 5)
) as t(ticker, sort_order)
where collections.name = 'Energy Dividend Payers';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('PEP', 1), ('WMT', 2), ('MO', 3), ('KMB', 4), ('CLX', 5)
) as t(ticker, sort_order)
where collections.name = 'Consumer Staples';

insert into public.collection_tickers (collection_id, ticker, sort_order)
select collections.id, t.ticker, t.sort_order from public.collections, (values
  ('HON', 1), ('CAT', 2), ('GD', 3), ('PH', 4), ('DOV', 5)
) as t(ticker, sort_order)
where collections.name = 'Industrial Dividend Payers';
