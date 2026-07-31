# Client feedback — 2026-07-31 walkthrough

> Source: screen-share walkthrough with Welson (client), transcribed. Cleaned up and organized by area, with root cause noted where already diagnosed against the current codebase. Distinct from the earlier 2026-07-27 meeting (`Design-System` overhaul, hiring a designer) — this session is about **functional correctness**, not visual design. The client was explicit: visual/design items should wait for the hired designer's Figma output; data/behavior bugs should be fixed regardless.

## 1. Calendar — privacy filter for amount vs. company

**What he wants:** A settings toggle to control what the calendar shows, so he can record demo/marketing videos of his *real* portfolio without exposing which companies he holds:
- Show ticker + amount (current behavior)
- Show amount only (hide company/ticker identity)
- Show ticker/company only (hide dollar amounts)

**Current state:** `app/(dashboard)/calendar/page.tsx` builds each calendar event as a single pre-formatted string — `` `${event.ticker} $${amount}` `` (`calendar/page.tsx:49`) — ticker and amount are baked together before they ever reach `CalendarGrid`. Supporting this toggle means splitting `CalendarDayEvent` into separate `ticker`/`amount` fields and deciding what to render at the display layer, plus a new user preference (stored per-user, e.g. a `profiles` column or a client-side setting) to remember the choice.

**Open question for the client:** does this need to be a persistent account setting, or just a view toggle for the current session (relevant since he specifically wants it for recording videos)?

## 2. Annual dividend income / monthly / per-day figures are significantly wrong

This is the most concrete, highest-confidence bug from the call. He gave a specific example: the app shows him earning roughly **27 cents/month**, when in reality he receives *more than that every single day*. He also cross-checked against the calendar (which shows many more dividend events this month than the annual figure implies) and concluded the income math doesn't add up.

**Root cause (confirmed in code):** `app/(dashboard)/dashboard/page.tsx` computes `annualIncome` as:

```ts
annualIncome += value * quote.trailingAnnualDividendYield;
```

This is an **estimate derived from Yahoo Finance's `trailingAnnualDividendYield` field**, not a sum of his actual tracked dividend history. His holdings (QDTE, TSLY, RDTE, NVDY, XDTE, MSTY-style tickers, per the dividend history/calendar screenshots) are weekly/monthly synthetic-income and covered-call ETFs — a category where Yahoo's trailing-yield field is frequently null, stale, or badly understated, because these funds don't pay on a clean quarterly cadence a "trailing yield" field assumes. `incomePerDay` (`annualIncome / 365`) and the monthly figure are both derived from this same bad number, so the error propagates everywhere it's shown.

**Verified with live data (2026-07-31), not just theory.** Pulled QDTE directly from both Yahoo endpoints the app calls:
- The chart endpoint's real dividend history (`events.dividends`) shows 53 payments in the trailing 365 days summing to **$13.33/share** against a $28.53 price — a real yield around **47%**.
- The quoteSummary endpoint — the actual source of `quote.trailingAnnualDividendYield` — returns `"trailingAnnualDividendYield": { "raw": 0, "fmt": "0.00%" }` for the same ticker, same moment. `dividendRate`, `dividendYield`, `exDividendDate`, and `payoutRatio` are all empty objects too — Yahoo's provider simply doesn't carry clean dividend metadata for this fund category.

So `value * quote.trailingAnnualDividendYield` contributes **exactly $0** to his annual income for every share of QDTE he holds — one of his most active weekly payers. Not an approximation error, a hard zero. This is the precise mechanism behind "the app shows 27 cents/month when I actually get more than that every day."

**FIXED 2026-07-31.** Income now comes from recorded `dividend_events` history — `shares × Σ(amount_per_share)` over the trailing 12 months — in a new shared helper, `lib/dividend-data/income.ts` (`computeTrailingIncome`). Yahoo is still used for **price** (that part of its data is fine); only the yield-derived income was replaced.

Measured against his real portfolio the day of the fix:

| | Annual | Monthly | Daily |
|---|---|---|---|
| Before (Yahoo yield) | $8.66 | $0.72 | $0.02 |
| After (trailing 12mo) | **$123.20** | **$10.27** | **$0.34** |

A 14× correction. Yahoo reported `0.00%` for **13 of his 15 tickers** — not just exotic funds; SCHD and JEPI are mainstream dividend ETFs and both returned zero. Only VOO (0.80%) and O (5.04%) had usable values, so the dashboard was effectively computing his whole income from two positions.

Deliberate choices worth remembering:
- **Trailing 12 months, not a forward projection.** Chosen for stability and because it's the industry-standard framing; it also handles quarterly payers correctly, whereas annualizing a shorter window makes them swing wildly depending on whether the window happens to catch a payment. The label reads "trailing 12mo" on the dashboard rather than implying a forward promise.
- **Known caveat:** several of his weekly options-income ETFs have declining distributions (TSLY −32%, XDTE −36%, METW −35% vs their 12-month average), so TTM currently reads ~31% above his present run rate ($123.20 vs $93.70 annualized from the last 90 days). This is inherent to TTM, not an error. If he ever asks why the figure looks high relative to recent payments, that's the reason — and the alternative (recent-window annualization) was rejected as too unstable for quarterly holdings.
- **Row-limit guard:** the helper caps its query at 5,000 event rows because a silently truncated PostgREST result would under-report income — the exact failure class being fixed. His portfolio returns 399.
- `tickersWithoutHistory` is returned so genuine non-payers (PLUG, SPCX) can be surfaced rather than silently counted as zero.

**Data cleanup done while validating this.** Auditing all 20 tickers in `dividend_events` against Yahoo turned up exactly one bad row: a KO dividend of `$0.01` dated `2026-07-23` that Yahoo has no record of (Yahoo shows 4 payouts totalling $2.08; we held 5 totalling $2.09). Likely a test seed or a value Yahoo briefly published and retracted — `dividend_events` only ever upserts, so anything recorded once persists even if the source later drops it. The row was deleted, cascading away the two `$0.10` payments it had generated; both belonged to internal test accounts (`shujaqurashi2172`, `hassangill9393`), never the client. KO now reconciles with Yahoo exactly.

Automatic reconciliation was **deliberately not added**: deleting any stored event missing from Yahoo's current response would erase all history older than the rolling 365-day window, and a transient Yahoo outage could destroy real data. One bad row in 429 does not justify that risk.

## 3. "Today's income" / "Next payment" / notifications — confirmed root cause

He noticed today's income never updates and he received no notifications, and — importantly — **reasoned through it himself and correctly ruled out Plaid/sandbox as the cause**: his holdings were entered manually, and Plaid's only job is pushing broker data into the same tables manual entry uses, so a Plaid sandbox limitation can't explain why manually-entered holdings don't show confirmed payments.

He's right — and the root cause is now confirmed exactly, not inferred. **FIXED 2026-07-31.**

`app/api/jobs/detect-dividends/route.ts` only created a `dividend_payments` row (the table that drives both "today's income" and every notification channel) when a freshly-fetched event's `pay_date` **exactly equalled today**. The scheduled job ran at **06:00 UTC**. Yahoo publishes a dividend into its feed at the ex-date's **market open, 13:30 UTC** — verified against the raw chart endpoint, where every event for QDTE/XDTE/RDTE/NVDY/TSLY carries a timestamp of exactly `13:30:00Z`.

So the job checked for "today's" dividends **7.5 hours before the data could possibly exist**, found nothing, and by the next run `today` had rolled over — skipping the event permanently. This wasn't intermittent; the scheduled cron could never detect anything.

Production evidence gathered while diagnosing:
- Five events dated `2026-07-30` carry `fetched_at = 2026-07-31T06:00Z` — first seen a full day late. (`fetched_at` is only set on insert, so this proves the July 30 run genuinely did not see them.)
- The **only** two `dividend_payments` rows in the entire database were both notified at `22:25 UTC` — a manual test run after market open, never the cron. That also explains why he received notifications once ("last week") and never again.

**Fix applied:**
1. Replaced the exact match with a bounded trailing window (`DETECTION_WINDOW_DAYS = 3`). Bounded deliberately: the DB holds 429 historical events, so an unbounded `pay_date <= today` would have inserted a payment row for every one and fired ~860 notifications on the next run.
2. Rescheduled the cron `06:00 → 14:00 UTC` (`supabase/migrations/20260731000000_reschedule_dividend_detection.sql`) so payouts are caught the same day, shortly after Yahoo publishes, rather than 24 h late — then immediately shifted again to **15:00 UTC** (`20260731010000_dst_safe_dividend_detection.sql`). pg_cron schedules in UTC while market open is fixed to 9:30 AM *local* ET, so 14:00 UTC sits 30 min after open in summer but 30 min *before* it in winter — which would have silently re-broken detection every November. 15:00 UTC clears open year-round (11:00 AM ET in summer, 10:00 AM ET in winter) and still lands in the client's morning.
3. Made `fetchDividends` uncached (`cache: "no-store"`). It's called only by this job; a cached response taken an hour earlier would be missing exactly the payout the run exists to find, silently reintroducing the bug.
4. Fixed a latent second bug found along the way: a payment whose notification failed left `notified_at` null and could **never** be retried, because the next run's insert hit the unique constraint and bailed out before the notify step. It now re-reads the row and retries delivery only if it never went out.

Verified by read-only dry run against production: the next run creates exactly **5 payment rows** (the missed July 30 payouts) and sends **10 messages** — no backlog stampede.

**Also worth telling him directly:** the `dividend_events.pay_date` field is actually Yahoo's **ex-dividend date**, not a real payment date (Yahoo's unofficial endpoint doesn't expose a separate pay date — documented as a known approximation in `lib/dividend-data/yahoo-finance.ts`). Real payment typically follows the ex-date by 2–4 weeks. This is a separate, pre-existing limitation from the cron timing bug above, and likely contributes to his sense that "the day it shows doesn't match when the company actually paid."

## 4. Holdings — logos, autocomplete, "not connected to Yahoo"

Same core ask as the earlier design-system conversation, restated with a concrete example: typing "KO" should surface "Coca-Cola" and auto-fill the company name, the same way search already needs to happen for any ticker so an ordinary person (his example: "your mom") can recognize what they're looking at instead of a bare ticker like "QQM." He also believes Holdings isn't connected to any live data source at all.

**Status:** this exact feature (`TickerSearchCombobox` + `TickerLogo`, backed by Finnhub search/logo lookup, wired into the add-holding form and the holdings table) was already designed and built in an earlier session. It was discarded when the `UI-Redesign` branch was deleted (per explicit instruction, uncommitted). **Needs to be rebuilt** — the earlier plan/approach is still valid and can be reused directly.

## 5. Dividends page needs the "hero" income summary

He was explicit: "dividend is the heart of the app" — when you open Dividends, it should immediately show per-day / per-month / per-year income, prominently, the way the *marketing site's* demo (`components/marketing/product-tabs.tsx`'s `DividendsPanel`, which already has exactly this three-stat row) does. The **real** `app/(dashboard)/dividends/page.tsx` has no such summary today — it only has "Confirmed payments" and "Dividend history" tables, so the page currently reads as empty/pointless to him. Once #2/#3 above are fixed (real income numbers, working detection), add this summary row to the actual Dividends page using the corrected calculation.

## 6. Collections — no search

He compared against a competitor that lets you search/browse any category or ticker. PaidPrime's Collections page only shows the fixed admin-curated list (`REITs`, `High Yield`, `BDCs` per `supabase/migrations/20260725000000_collections.sql`) with no way to look up anything outside it — confirmed, there's no search input anywhere in `collection-table.tsx` or `collections/page.tsx` today.

**Fix direction:** add a search bar that queries tickers directly (reusing the Finnhub-backed search from #4) so users aren't limited to the curated list, independent of whatever the curated collections themselves show.

## 7. Add-to-watchlist from Collections is over-restricted

He can already add a curated collection ticker to his watchlist from the Collections page — that part works. But that quick-add is limited to only the tickers already shown in a collection; there's no free-text search to add *any* ticker to the watchlist from that flow. (The main `/watchlist` page's own add-holding form is not affected — it already has a normal ticker input, and will get the same autocomplete upgrade as #4/#6.)

## 8. Diversification — deferred

He called this "so-so" and explicitly deferred it to the designer's upcoming visual pass — no functional complaint here, just visual, so no action needed until Figma designs land.

---

## Suggested sequencing

**Fix now (functional, not blocked on the designer):**
1. Dividend detection cron date-matching bug (#3) — highest impact, single root cause behind three separate symptoms he flagged (missing notifications, "today's income," calendar/dividends mismatch).
2. Annual/monthly/daily income calculation (#2) — rebuild from real `dividend_events` history instead of Yahoo's trailing yield estimate.
3. Rebuild `TickerSearchCombobox` + `TickerLogo` (#4) — already designed once, known-good approach.
4. Collections search (#6), reusing the same ticker-search backend as #4.
5. Dividends page income summary row (#5) — do after #2/#3 so it displays correct numbers from day one.
6. Free-text add-to-watchlist from Collections (#7).

**Needs a decision from the client first:**
- Calendar privacy filter (#1) — confirm whether it's a persistent setting or a session-only view toggle before building it.

**Wait for the designer (visual only, no functional gap):**
- Diversification page (#8).
- General polish on Holdings ("no life on that") once logos/autocomplete land — cosmetic layer on top of #4, can follow whatever the designer produces.
