-- PaidPrime — record how many investment accounts a connection shared.
--
-- Plaid's Account Select screen lists every account an institution offers:
-- checking, savings, credit cards, loans, IRA, 401k, brokerage. A user can
-- complete the entire connect flow having selected none of the investment
-- ones — which is easy to do at a real brokerage, where Fidelity and
-- Schwab present cash management alongside the brokerage account.
--
-- Confirmed live against Plaid Sandbox: Platypus OAuth Bank offers 14
-- accounts, of which 2 are investment (IRA, 401k) and hold 13 positions.
-- Selecting three depository accounts instead produced an Item with zero
-- investment accounts. The connection then went green with "Synced", zero
-- holdings, and no explanation of what went wrong or how to fix it.
--
-- Nothing in broker_connections could distinguish that from a genuinely
-- empty brokerage account, so the UI had nothing to say. null means never
-- synced; 0 means the user shared no investment accounts.
alter table public.broker_connections
  add column investment_account_count integer;

comment on column public.broker_connections.investment_account_count is
  'Investment-type accounts on this Item at the last sync. 0 means the user selected no investment accounts in Plaid Link; null means not yet synced.';
