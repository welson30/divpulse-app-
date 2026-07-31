# Session handoff — PaidPrime engineering context

> Written 2026-08-01 to hand off a long working session to whoever/whatever picks this up next. Read this first; it links out to the detailed record. If anything here conflicts with the live code or `git log`, trust the code — this is a snapshot, not a source of truth.

## What PaidPrime is

A dividend-income tracking SaaS (Next.js 16 / React 19, Supabase, deployed on Vercel at paidprime.com). Users add holdings (manually, CSV import, or Plaid broker-sync), and the app tracks dividend payments, notifies them the day a payment lands (push + Telegram), and shows income/portfolio views. Formerly named DivPulse — some legacy references may still say that.

**Client:** Welson (`welsonsousa71@gmail.com`), non-technical, building this himself. Two things worth knowing about working with him:
- He's sharp at reasoning through bugs even without technical vocabulary — in this session he correctly ruled out Plaid as the cause of a notification bug through his own logic, and was right.
- He got legitimately upset earlier in the project when told a feature was "tested and working" when it had only been tested against a fake sandbox environment, not a real account. Precision about what was actually verified, versus what wasn't, matters a lot to him going forward — don't round up.

## Primary reference doc

**`docs/client-feedback-2026-07-31.md`** is the living record of this session's actual work — every bug, root cause, evidence gathered, and fix applied, in detail, updated in real time as things happened. This handoff file is an index into that, not a replacement for it. Read that doc for the full technical detail on anything summarized below.

## What happened this session, roughly in order

1. **A large UI/design-system redesign effort was done and then entirely discarded.** Categorical color palette, motion tiers, ticker logos, Finnhub integration — all built on a branch called `UI-Redesign`. The user later asked to delete that branch; confirmed twice that the uncommitted work should be discarded, then it was — branch deleted both locally and on `origin`. **This work no longer exists anywhere.** If something references it, it's stale.
2. **Stripe test→live migration** was explained (which env vars change, that price IDs are mode-scoped, webhook secret specifics) — informational only, not executed. Live keys are not in place.
3. **Plaid was explained and partially scoped**, but the actual OAuth redirect handling was never built (see Outstanding work below). Plaid is still on **sandbox** — no real brokerage account can connect until either Plaid Trial-plan eligibility is confirmed or full Production access is granted (client-side action on the Plaid dashboard, not something fixable in code alone).
4. **Two significant production bugs were root-caused, fixed, deployed, and verified against live data**:
   - **Dividend detection never worked on schedule.** The cron ran at 06:00 UTC; Yahoo doesn't publish a dividend into its feed until market open, 13:30 UTC. The job was checking for "today's" payments 7.5 hours before the data could exist, and once the date rolled over the event was permanently missed (not just delayed). Confirmed via direct production database queries: every payment record that had ever existed was from a manual test trigger, never the schedule. Fixed with a bounded trailing-window match (not an unbounded one — the DB holds 429 historical events, so an unbounded match would have fired ~860 notifications on the next run), rescheduled the cron to 15:00 UTC (DST-safe year-round), made the Yahoo fetch uncached, and fixed a second latent bug where a failed notification could never be retried. Verified live: triggered the job, 5 real payments created, 10 notifications delivered (push + Telegram), re-ran it to confirm idempotency (zero duplicates).
   - **Dashboard income was wrong by 14x.** It computed annual income from Yahoo's `trailingAnnualDividendYield` field, which returns **0.00%** for 13 of the client's 15 holdings — not just exotic ones; mainstream funds like SCHD and JEPI also read zero. Rebuilt to sum real `dividend_events` history instead (`lib/dividend-data/income.ts`, trailing 12 months). Client's income went from a reported $8.66/yr to a verified-correct $123.20/yr. While verifying this on a second account, found and deleted one phantom database row (a $0.01 KO dividend that doesn't exist in Yahoo's actual feed) — did not affect the client, only a test account.
5. **A large "trading-app feel" feature build**, in direct response to the client saying he's drawn to the red/green up-down charts trading apps use. This is the bulk of the most recent work:
   - Researched Yahoo's unofficial API surface in depth: a batch quote endpoint (up to 15+ tickers, 66 fields, one request), a batch sparkline endpoint, and a search endpoint (no API key). Chose **not** to add a charting library (recharts alone is ~7MB plus Redux) — sparklines and the income bar chart are hand-rolled SVG, consistent with how the rest of the app already draws charts.
   - Built a shared enrichment layer (`lib/tickers/enrich.ts`) so any page gets logos + live quotes + sparklines for however many tickers in exactly **two** upstream requests, never one-per-ticker.
   - Solved ETF logos (no financial API returns them) by matching the fund's issuer name to a domain and serving that domain's favicon (`lib/tickers/logo.ts`) — 15/15 coverage on the client's real portfolio.
   - Rolled all of it out across Holdings, Watchlist, Collections, Dashboard, and Dividends: logos, live price, day change (red/green), 1-month sparklines, 52-week range bars, market-open status, and — on Dividends specifically — a full rebuild from a raw 399-row wall of numbers into income-per-year/month/day stat cards, a 12-month bar chart, a top-earners list, and a capped, payout-amount-aware history table.
   - Found and fixed a **second** instance of the broken-yield bug, this time on Collections (same root cause, same fix pattern).
   - Built ticker autocomplete on Yahoo's search endpoint (typing "KO" or "coca" suggests "The Coca-Cola Company" and auto-fills it) — no API key, filters out the option-contract noise Yahoo's search otherwise returns.
   - Added small `?` info tooltips explaining financial jargon (52-week range, yield, etc.) across the new UI, then had to fix three real bugs in that component from the client's own screenshots: it was clipping inside table scroll containers (now portals to `document.body`), the glyph sat off-center (inherited uppercase letter-spacing from table headers), and — the interesting one — **it rendered empty specifically on server-rendered pages and correctly on the one client-rendered page**, because the copy object lived inside a `"use client"` file and Server Components importing non-component values from client modules silently get `undefined`. Fixed by moving the copy to a plain module (`lib/tips.ts`) with no client boundary.

## Things the user did directly (not done by the assistant — don't assume otherwise)

- Deleted the `UI-Redesign` branch, local and remote, after explicit confirmation.
- Ran all Supabase migrations manually via the Supabase SQL editor — **the Supabase MCP connection available in this environment is not linked to this project** (it only sees two unrelated projects). Any future migration needs to be handed to the user to run, not assumed to run automatically.
- Committed and pushed most of this session's work directly via their own tooling (not via `git commit` calls from the assistant). Check `git log` for the true commit history rather than assuming anything described here is uncommitted.
- **Renamed `app/page.tsx` → `app/page1.tsx` and replaced `page.tsx` with a "coming soon" placeholder**, as their own urgent, out-of-band fix (commit `3c2a5b1`). Explicitly told the assistant to ignore this and not revert it. **The live homepage is currently a placeholder by design — do not "fix" this without asking why first.**

## Current repo state (verify against `git status`/`git log` — this will drift)

As of this handoff, committed and pushed through `3c2a5b1`. Uncommitted:
- Modified: `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/dividends/page.tsx`, `components/dashboard/add-holding-form.tsx`, `components/dashboard/add-watchlist-form.tsx`, `components/dashboard/collection-table.tsx`, `components/dashboard/holdings-table.tsx`, `components/dashboard/info-tip.tsx`, `components/dashboard/watchlist-table.tsx`, `docs/client-feedback-2026-07-31.md`
- New: `components/dashboard/ticker-search-combobox.tsx`, `lib/tickers/search.ts`

This is the ticker-autocomplete work plus the three InfoTip bug fixes — typechecked, linted, and `next build` verified clean, just not yet committed by the user.

## Environment / infrastructure notes

- `.env` is populated with real credentials (Supabase, Stripe test-mode, Plaid **sandbox**, Firebase, Resend, Telegram, `CRON_SECRET`, `ENCRYPTION_KEY`). It's gitignored — don't assume a fresh clone has it.
- `FINNHUB_API_KEY` was added earlier in the project's history but is **no longer used anywhere** — everything (search, quotes, sparklines, logos) now runs on Yahoo's unofficial endpoints instead, added this session. If the key is still in `.env`, it's vestigial.
- OneSignal credentials exist in `.env` but the app actually sends push through Firebase — `docs/services.md` is stale on this point (not fixed this session, just noted).
- A useful pattern established this session: verifying claims against **live production data** directly via the Supabase REST API (`curl` with the service-role key from `.env`) before asserting anything as fact, rather than reasoning from code alone. Worth continuing — it's what caught the phantom KO row and proved the cron bug's exact mechanism.

## Outstanding work (not started, or started and paused)

- **Collections page:** add search (should reuse `lib/tickers/search.ts`) and free-text add-to-watchlist — currently locked to the curated collection list. Discussed, not built.
- **Calendar privacy filter:** client wants to show/hide dividend amounts vs. company names on the calendar (for recording demo videos without exposing his real portfolio). Blocked on one open question to the client — persistent account setting or session-only toggle? — never asked.
- **Plaid OAuth redirect handling:** researched and explained in depth (redirect_uri registration, `sessionStorage` token persistence across the bank-login redirect, resuming Link with `receivedRedirectUri`, `onExit` handling, token-expiry handling) but not implemented. Also gate: real accounts can't connect at all until Plaid Trial/Production access is sorted on the client's Plaid dashboard — that's outside this codebase.
- **Diversification page and general visual polish:** explicitly deferred — the client wants to see the hired designer's Figma output before more visual work happens here.
- Three junk tickers (`ACHN`, an expired Netflix option contract, `NHX105509`) sit in a **test account**, not the client's — low priority, harmless, flagged once already.

## How to keep going

Read `docs/client-feedback-2026-07-31.md` top to bottom for full technical detail, check `git status`/`git log` to see what's actually landed since this was written, then pick up from "Outstanding work" above.
