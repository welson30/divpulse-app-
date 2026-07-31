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

## 4b. Market data, charts and logos across the app — DONE 2026-07-31

Not in the original feedback list, but it came directly out of the same review: the client is drawn to the red/green up-down charts trading apps use, and wanted logos and live figures everywhere rather than only on Holdings.

**Data layer.** Two batched Yahoo endpoints replaced the per-ticker fetch loop: `/v7/finance/quote` (`fetchQuotes`) and `/v8/finance/spark` (`fetchSparklines`). Any page now costs **exactly two upstream requests regardless of ticker count** — Collections was previously issuing one round trip per ticker across every collection. `lib/tickers/enrich.ts` (`enrichTickers`) wraps both plus logo resolution so no page re-implements it. Measured: 15 tickers, both requests, 1364 ms, 15/15 quotes and 15/15 sparklines.

**Logos without a logo API.** No provider returns ETF logos — Yahoo has no logo field, its `assetProfile.website` is null for every fund tested, and Finnhub is equity-only (its key was also removed from `.env`, so Finnhub is no longer used anywhere). Since a dividend portfolio is mostly ETFs, `lib/tickers/logo.ts` instead matches the issuer out of the fund's `longName` — which always leads with it — to a domain, and serves that domain's favicon. Pure function, no network call, no database. Coverage on the client's portfolio: **15/15**.

**Components added:** `Sparkline` + `ChangeBadge`, `TickerLogo`, `RangeBar` (52-week position), `MarketStateBadge` ("Market open · Real-time"), `VolumeStat`, `StatCard`, `MonthlyIncomeChart`, `InfoTip`.

**No charting library.** Sparklines and the income chart are hand-rolled SVG. recharts would have added ~7 MB and 11 transitive packages including Redux to draw polylines; raw SVG also keeps these server-rendered. If a full interactive chart with crosshair/candlesticks is ever wanted, TradingView's `lightweight-charts` (3 MB, 1 dep) is the pick.

**Rolled out to:** Holdings (logo, name, price, day change, 1M sparkline, market value, portfolio total, market-state badge), Watchlist (all of the above plus the 52-week range bar), Collections (logo, name, price, change, sparkline), Dashboard (logos on payment tiles, Recent Holdings as mini cards with sparklines, stat cards with day-change colouring), Dividends (logos on both tables).

**Second broken-yield bug found and fixed.** Collections was reading the same `trailingAnnualDividendYield` field as §2, so SCHD, JEPI and most ETFs displayed **0.00% yield**. It now uses Yahoo's `dividendYield`, which is accurate for the conventional payers Collections contains (SCHD 3.3% vs real 3.14%, JEPI 8.11% vs 7.97%, O 5.05% vs 5.09%). That field is documented in the type as **never** safe for income maths — it reports 2.04% for QDTE against a real ~47%.

**Explainer tooltips.** Financial terms across the tables and stat cards carry a `?` (`InfoTip`) with plain-language copy — "52-week range", "Today", "1M", "Yield", "Value", annual income, income per day. Opens on hover, focus **and** click, so it works on touch as well as mouse, closes on Escape, and is wired via `aria-describedby`.

Three follow-on bugs found through the client's own screenshots and fixed same-day: the bubble was clipping inside every table's `overflow-x-auto` wrapper (now renders through a React portal into `document.body`, escaping all ancestor overflow/stacking); the `?` glyph sat visibly off-centre because it inherited the table headers' `font-mono uppercase tracking-[0.06em]` (now resets font/tracking and uses `align-middle`); and it rendered an **empty bubble specifically on Dividends and Dashboard while working correctly on Holdings** — the copy object lived inside `info-tip.tsx`, a `"use client"` file, and a Server Component importing a non-component value from a client module gets a client reference rather than the real value, so `TIPS.exDate` silently read as `undefined` server-side. Moved the copy to `lib/tips.ts`, a plain module with no client boundary, importable identically from both.

**Known limitation: no true profit/loss.** `holdings` stores no purchase price, so cost basis doesn't exist and real gain/loss cannot be computed. The dashboard shows **today's** change instead (portfolio value vs the sum of previous closes), which is real, correctly red/green, and what brokerage apps lead with. Showing lifetime P/L would require capturing a purchase price per holding — a schema and UI change, worth raising with the client.

## 4c. Dividend history table was unusable — FIXED 2026-07-31

Reported as "the table feels really off." It was rendering **every** event with no cap — 399 rows for the client's portfolio — and each row showed only a per-share figure like `$0.14`, which is meaningless without knowing the share count. Nothing told the user what they actually received.

Rebuilt to show **Asset (logo + name) · Ex-date · Per share · Your shares · Your payout**, where payout is `shares × amount_per_share` in green — the number the user actually cares about. Capped at the 60 most recent with a "Most recent 60 of 399 payouts" caption, per-share widened to 4 decimals since weekly distributions are frequently sub-cent at 2, and `?` explainers added to "Ex-date" and "Per share".

## 4d. Ticker autocomplete — DONE 2026-08-01

The original ask, now built: typing "KO" or "coca" into the ticker field suggests "The Coca-Cola Company" and auto-fills the company name field on selection.

Built on Yahoo's `/v1/finance/search` endpoint — no API key, already the app's data source, so no new vendor. Its raw results include option contracts and futures alongside real securities (searching "QDTE" returns 7 matches, 6 of them option contracts like "QDTE Dec 2026 19.000 put"); `lib/tickers/search.ts` filters to `EQUITY | ETF | MUTUALFUND` only. Verified against KO, coca, QDTE, vang, jpmorgan — all resolve correctly.

`TickerSearchCombobox` (debounced 250ms, arrow-key navigable, click-outside to close) is hand-rolled rather than built on a combobox library — no such dependency exists in the project yet and this doesn't justify adding one. Wired into both `AddHoldingForm` and `AddWatchlistForm`, replacing the plain ticker input in each; doesn't block manual entry, so a ticker Yahoo's search doesn't surface still submits fine.

**Logos added to the dropdown — DONE 2026-08-01.** The result list initially shipped as ticker/name/exchange text only — flagged as not matching the logo treatment already on Holdings/Watchlist/Collections. `TickerSearchResult` now carries a `logoUrl`, resolved the same way as everywhere else (`resolveLogoUrl` on the result's name, pure string match, no extra request), and each row renders it through the existing `TickerLogo` component (`size="sm"`). The exchange tag was also changed from bare text to a small rounded pill to match the pill styling used elsewhere this session.

**Logo coverage gap found and fixed — DONE 2026-08-01.** Free-text search surfaces arbitrary tickers, not just the curated portfolio the static `NAME_TO_DOMAIN` list was built against — client screenshot showed Wayfair, Hotchkis & Wiley and others falling back to monograms. Two changes:
- Expanded `NAME_TO_DOMAIN` with ~45 more ETF issuers and common dividend equities (Nuveen, Franklin, Hartford, Principal, ABBVie, Walmart, Costco, the major banks, etc.) — still zero network cost, same pure-function match.
- Added [Logo.dev](https://www.logo.dev) as a second-choice source when the static match misses: `resolveLogoUrl(name, ticker)` now also builds an `img.logo.dev/ticker/{ticker}?...&fallback=404` URL. Chose Logo.dev after checking current options live — Clearbit's Logo API, the obvious first instinct, was **shut down in December 2025**. The free "no API key" alternative found (AllInvestView) requires a mandatory visible backlink on the page, which isn't appropriate for a paid product, so it was ruled out. Logo.dev needs a free publishable key (`NEXT_PUBLIC_LOGO_DEV_KEY` in `.env`, client obtained it directly) but explicitly covers "Stocks, ETFs, and funds" by ticker, 500K free requests/month, no card required.
- `fallback=404` (instead of Logo.dev's own bundled monogram) lets `TickerLogo`'s new `onError` handler catch a genuine miss and drop to the app's own styled monogram — so every fallback in the app looks the same regardless of which source failed to resolve it, rather than mixing two different monogram styles.
- **Attribution added.** Logo.dev's free tier requires commercial users (PaidPrime has paid plans) to show a visible "Logos provided by Logo.dev" link on a public production page. Added to the footer of the live coming-soon page (`app/page.tsx`) — the only publicly reachable page in production right now — and pre-emptively to the real marketing page's footer (`app/page1.tsx`) for whenever that's restored.
- Verified live: `W` (Wayfair) and `KO` now resolve real logos via Logo.dev that previously showed monograms; genuinely obscure tickers (`ISNRW`, `HWO`) still 404 through Logo.dev too and correctly fall through to the monogram — expected, not a bug.
- Added `baillie gifford` → `bailliegifford.com` to the static list after the client found `BGUS` (Baillie Gifford U.S. Equity Growth ETF) still showing a monogram — confirmed Logo.dev 404s on it too, so no source had it; a known, legitimate asset manager belongs in the curated list same as the others.

**Static list expanded again — DONE 2026-08-01.** Added ~40 more famous/heavily-searched names (Amazon, Tesla, Disney, Boeing, Ford, GM, American Express, UnitedHealth, Kraft Heinz, and others) — including several that don't pay dividends at all, since free-text search surfaces anything and recognizability matters more than payer status there. Every new domain was individually curl-verified against the actual favicon service before being added, not assumed from memory — two initial guesses (`kraftheinzcompany.com`, `conocophillips.com`) 404'd and had to be corrected (`kraftheinz.com`, `www.conocophillips.com`).

**Regression introduced and fixed same day: broken-image flash.** Making `resolveLogoUrl` sometimes point at a URL that's *designed* to 404 (Logo.dev's `fallback=404`) meant `TickerLogo`'s `onError`-swap approach had a window where the browser's native broken-image icon rendered before React could react and drop to the monogram — never an issue before, since the old Google-favicon-only URLs essentially never failed to load. Fixed by restructuring `TickerLogo`: the monogram is now the permanent base layer, and the logo `<img>` sits on top starting at `opacity: 0`, only fading in on `onLoad`. A failing image never becomes visible at all — no flash, no broken-icon glyph, just the monogram that was already correct underneath the whole time.

## 5. Dividends page — DONE 2026-07-31

He was explicit: "dividend is the heart of the app" — when you open Dividends, it should immediately show per-day / per-month / per-year income, prominently, the way the *marketing site's* demo (`components/marketing/product-tabs.tsx`'s `DividendsPanel`, which already has exactly this three-stat row) does. The **real** `app/(dashboard)/dividends/page.tsx` has no such summary today — it only has "Confirmed payments" and "Dividend history" tables, so the page currently reads as empty/pointless to him. Once #2/#3 above are fixed (real income numbers, working detection), add this summary row to the actual Dividends page using the corrected calculation.

## 6. Collections — no search — DONE 2026-08-01

He compared against a competitor that lets you search/browse any category or ticker. PaidPrime's Collections page only shows the fixed admin-curated list (`REITs`, `High Yield`, `BDCs` per `supabase/migrations/20260725000000_collections.sql`) with no way to look up anything outside it — confirmed, there's no search input anywhere in `collection-table.tsx` or `collections/page.tsx` today.

**Fixed.** Added a free-text search box (`CollectionSearch`) above the curated lists on `/collections`, backed by a new server action (`searchCollectionTickers`, `app/(dashboard)/collections/actions.ts`) that reuses the same Yahoo search endpoint (`lib/tickers/search.ts`) and enrichment layer (`lib/tickers/enrich.ts`, so no page re-implements the price/logo/sparkline fetch) already built for #4's autocomplete. Debounced 300ms so it doesn't fire on every keystroke — only once typing pauses. Results render through the existing `CollectionTable`, independent of whatever the curated collections contain.

## 7. Add-to-watchlist from Collections is over-restricted — DONE 2026-08-01

He can already add a curated collection ticker to his watchlist from the Collections page — that part works. But that quick-add is limited to only the tickers already shown in a collection; there's no free-text search to add *any* ticker to the watchlist from that flow. (The main `/watchlist` page's own add-holding form is not affected — it already has a normal ticker input, and will get the same autocomplete upgrade as #4/#6.)

**Fixed as a side effect of #6.** `CollectionTable`'s per-row Watch button already called `watchTicker(ticker, companyName)` with no restriction to curated tickers — it just never received anything but curated rows before. Routing search results through the same table means free-text add-to-watchlist works with zero new logic, only the new search feeding it.

## 8. Diversification — deferred

He called this "so-so" and explicitly deferred it to the designer's upcoming visual pass — no functional complaint here, just visual, so no action needed until Figma designs land.

## 9. Remove / Watch button polish — DONE 2026-08-01

Not from the original feedback list — a direct ask to make the row-action buttons on Holdings and Collections feel like "a premium trading app" rather than plain text links.

- **Holdings — Remove** (`holdings-table.tsx`): was an unstyled text link (`hover:text-red-500`). Now a ghost pill — `Trash2` icon + label, transparent by default, fills red-tinted (`border-red-500/30 bg-red-500/10 text-red-500`) only on hover, so it carries no visual weight until the user is actually about to act on it.
- **Collections — Watch/Watching** (`collection-table.tsx`): was a plain text link in both states. Unwatched is now an outlined pill with a `+` icon that fills green on hover, swapping to a spinner while the add is pending; watched is a solid green-tinted pill with a checkmark reading "Watching," linking to `/watchlist` — reads as a confirmed-state chip rather than an underlined link.

**Not done:** Watchlist's own Remove button (`watchlist-table.tsx`) still uses the old plain-text style — it's pixel-identical to what Holdings had before this pass, but wasn't in scope for this ask. Worth the same treatment for consistency next time Watchlist comes up.

---

## Suggested sequencing

**Fix now (functional, not blocked on the designer):**
1. ✅ Dividend detection cron date-matching bug (#3) — highest impact, single root cause behind three separate symptoms he flagged (missing notifications, "today's income," calendar/dividends mismatch).
2. ✅ Annual/monthly/daily income calculation (#2) — rebuild from real `dividend_events` history instead of Yahoo's trailing yield estimate.
3. ✅ Rebuild `TickerSearchCombobox` + `TickerLogo` (#4) — already designed once, known-good approach.
4. ✅ Collections search (#6), reusing the same ticker-search backend as #4.
5. ✅ Dividends page income summary row (#5) — do after #2/#3 so it displays correct numbers from day one.
6. ✅ Free-text add-to-watchlist from Collections (#7).

**Needs a decision from the client first:**
- Calendar privacy filter (#1) — confirm whether it's a persistent setting or a session-only view toggle before building it.

**Wait for the designer (visual only, no functional gap):**
- Diversification page (#8).
- General polish on Holdings ("no life on that") once logos/autocomplete land — cosmetic layer on top of #4, can follow whatever the designer produces.
