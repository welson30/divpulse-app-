# PaidPrime — Scope Comparison: Agreed vs. Actual

> **Internal findings document · Compiled 2026-08-04**
> Purpose: lay out, with dates and evidence, what was agreed at the start of the engagement versus what the project has grown into. Source material: the original Fiverr conversation (2026-07-11), `docs/services.md`, `docs/client-feedback-2026-07-31.md`, and the git commit history. `docs/PRD.md` is deliberately **not** used as evidence here — it's a document the developer wrote for internal reference, not something the client agreed to. No outreach message is drafted here — findings only.

---

## 1. What was agreed (2026-07-11, Fiverr)

**Quoted price/timeline:** $50–100 USD, 7–10 days — given *before* the technical specification was reviewed, explicitly framed as a rough estimate pending that review ("I'd like to review the technical specification before giving a final quote"). The budget the client and developer actually settled into going forward was **$100**.

**Actual payment so far:** $20 paid via Fiverr. A second order of $100 has been placed on Upwork (separate platform, separate order) but is not yet released/completed. Throughout the conversation the client repeatedly said things like "I will pay more," "I will tip" — informal verbal statements, not a revised written agreement, and no additional amount beyond the $100 Upwork order has actually materialized.

**Scope confirmed in writing** (client's message, 2026-07-11 10:29 PM, and developer's reply 10:40 PM confirming all of it as included):

1. Login with Supabase (email + Google)
2. All dashboard sections working with real data — holdings, dividends, calendar, goals, watchlist, collections, diversification
3. Push notifications via OneSignal
4. Stripe subscriptions (Free / Pro / Pro+)
5. Daily cron job detecting dividend payments via Yahoo Finance
6. Telegram bot alerts (client's bot, "already configured")
7. Plaid broker auto-sync for Pro+ users
8. PWA — installable on iPhone and Android
9. Design/UI adjustments "within the agreed scope" during development, with the prototype recommended as the design source of truth

**Feature list per the prototype** (dashboard, holdings tracker, dividend calendar, push notifications with 3 templates, diversification charts, goals & financial planning, watchlist, collections, settings) — this prototype was presented as *"exactly what needs to be built"*, i.e. both feature spec and visual spec in one artifact.

**Stack specified:** Next.js 14, Tailwind, Supabase, Stripe, OneSignal, Yahoo Finance (free, no key), Plaid, Telegram, Resend, OpenAI, Vercel.

---

## 2. What actually happened — scope growth by category

### A. Full rebrand mid-build (2026-07-17)
Not part of the original scope. DivPulse → PaidPrime rename touched the repo, package name, PWA manifest, metadata, all docs, and the marketing prototype in a single day (`feat: rename project from DivPulse to PaidPrime, update all references in code and documentation`), followed by a full color-palette/style pass across the app the same day.

### B. Custom marketing landing page built from scratch (2026-07-14 → 2026-08-01)
The original brief treated the Netlify prototype as a **reference/demo link**, not a deliverable to rebuild. In practice a full custom landing page was designed and built in code: mini charts, phone mockup, product tabs, receipt-card component, FAQ page, signup page, micro-interactions, custom icons, a "coming soon" page, and a separate layout system — roughly a dozen distinct commits (2026-07-14 to 2026-08-01) that have no line item in the original scope.

### C. Push notification pipeline rebuilt on a different vendor
Original scope: OneSignal, one line item. Actual: OneSignal was integrated (2026-07-20) and then went through roughly ten follow-up commits over two days fixing SDK loading, Safari support, service workers, blocked-permission dialogs, and duplicate-init bugs — before being **replaced entirely** with Firebase Cloud Messaging on 2026-07-23 (`feat: migrate from OneSignal to Firebase Cloud Messaging for push notifications`). This is a second implementation of the same feature, not an extension of it. A further notification subsystem — user-selectable notification styles, a notification bell component, and settings/DB schema for tracking — was added 2026-08-01, with no equivalent in the original "3 templates" description.

### D. Broker sync expanded well past "Plaid for Pro+"
Original scope: Plaid auto-sync for Pro+, described as the entire broker-sync story. Actual delivered surface (per `docs/services.md`): a three-tier system — manual entry (all plans, capped at 5 assets on Free), Plaid (Pro+, US brokers only), **and** CSV/Excel import (Pro+, added 2026-07-25) specifically to cover Brazilian/international brokers (XP, Avenue, Nomad) that Plaid doesn't support. This broker matrix, and the manual-entry asset cap by plan, isn't in the original Fiverr scope conversation at all.

### E. Collections and Calendar grew beyond their one-line mentions
- **Collections**: from "collections" (one word in the prototype feature list) to a curated-category system (REITs, High Yield, BDCs) with real-time Yahoo pricing, plus — after client feedback — a free-text search feature (2026-08-01) reusing a new ticker-search backend, plus sector filtering and yield calculations, plus a per-row "Watch" quick-add flow.
- **Calendar**: from "dividend calendar" to a system additionally covering FOMC meeting dates and quarterly earnings via Alpha Vantage or a maintained static list (documented in `docs/services.md` §5), plus a later-added privacy-filter setting (show ticker+amount / amount-only / ticker-only) for recording demo videos.

### F. First design rejection and the Figma redesign track (2026-07-27 → present)
After the client reviewed the built app on a screen-share call (2026-07-27), the UI was rejected as "not market-ready" — specific complaints: no company logos, no ticker autocomplete, a palette perceived as lifeless, diversification view showing too few colors, a settings bug. Agreed resolution at the time: **client hires a Figma designer** to produce visual designs (budget/cost of that designer is unknown to the developer); developer converts them to code on top of the existing feature set — explicitly scoped as a *visual* pass, not a feature rebuild.

The autocomplete and logo items from that call were pulled forward and built directly (not held for the designer) — see item list in section G below.

**Per the current request:** the client has now handed over detailed Figma files from the hired designer, expanding the "visual pass" into a full UI replication task across the app — this is now a second full front-end implementation pass on top of the first, not a token/color-swap.

### G. A second full feedback round surfaced ~16 additional items (2026-07-31 call)
Documented in `docs/client-feedback-2026-07-31.md`. A few of the 16 numbered items were **functional defects** genuinely inside the original scope (income math wrong by up to 14×, dividend-detection cron never firing at the right time, an unusable 399-row dividend table) — legitimate bugs, fairly counted as included in the original deliverable, listed here only for completeness. Everything else below was new surface, several items explicitly flagged in that document itself as "not from the original feedback list":

| Item | What it is | In original scope? |
|---|---|---|
| Calendar privacy filter | Settings toggle: show ticker+amount / amount-only / ticker-only, for recording demo videos | No — calendar was in scope, this toggle wasn't |
| Ticker autocomplete on add-holding | Typing "KO" suggests "The Coca-Cola Company" and auto-fills the name field (`TickerSearchCombobox`, debounced, arrow-key navigable) | No |
| Ticker autocomplete on add-watchlist | Same combobox wired into the watchlist add form | No |
| Company logos everywhere | `TickerLogo` component + two-source resolution (static domain map of ~85 issuers, plus Logo.dev as fallback after Clearbit's logo API was found shut down) rolled out to Holdings, Watchlist, Collections, Dashboard, Dividends, and the autocomplete dropdown itself | No |
| Live price/sparkline/change indicators everywhere | New shared data layer (`lib/tickers/enrich.ts`), `Sparkline`, `RangeBar` (52-week position), `MarketStateBadge`, `VolumeStat`, `StatCard`, `MonthlyIncomeChart` — rolled out across 5 pages | No |
| Explainer tooltips (`InfoTip`) | "?" hover/click/focus tooltips on financial terms across every table and stat card | No |
| Dividend history table rebuild | Changed from 399 unfiltered per-share rows to a capped, sorted "Asset / Ex-date / Per share / Your shares / Your payout" table | Partly a bug fix (table was "unusable"), partly new design |
| Dividends page income summary row | Per-day/month/year stat row added to the top of the real Dividends page (previously only on the marketing demo) | No |
| Collections free-text search | Search box + new server action reusing the ticker-search backend, so users can look up tickers outside the curated lists | No |
| Add-to-watchlist from Collections search | Watch button on search results, not just curated rows | No (side effect of the above) |
| Remove/Watch button restyle | Holdings "Remove" and Collections "Watch" changed from plain text links to icon pills with hover/pending states, "premium trading app" look | No — explicitly logged as "not from the original feedback list" |
| Per-ticker detail page | New route `/tickers/[ticker]` — live price chart (new `lightweight-charts` dependency), range switcher (1D–5Y/Max), key-stats grid, quick-stats row, three separate design-iteration passes against client-supplied mockups | No — explicitly logged as "not from the original feedback list" |
| Dashboard visual redesign | Restructured stat cards, hero stat, icon chips, decorative background wave, against a supplied mockup | No — explicitly logged as "not from the original feedback list" |
| Dividends page visual redesign | Goals cross-link card, growth-insight banner, unified paid/pending table, against a supplied mockup | No — same pass as above |
| Mobile header + bottom nav rebuild | Replaced hamburger/drawer with a slim header + 5-tab bottom bar + "More" bottom sheet, to match a supplied mockup | No |
| Push-notification toggle relocated into Settings | Real enable-notifications control duplicated from the topbar into the Settings page | No |
| Mobile horizontal-scroll fix | Holdings/Watchlist/Collections tables rebuilt with a genuine single-column mobile layout (previously just `overflow-x-auto`) | No — table existed, mobile layout didn't |
| Decorative background wave on every page header | Ambient graphic rolled out to Holdings, Watchlist, Collections, Calendar, Goals, Diversification, Settings, Dividends | No — purely cosmetic addition |

### H. Cron and data-integrity hardening
Not scope items in the original sense, but real engineering time: the dividend-detection cron schedule was adjusted at least four separate times (2026-07-24, 07-31 ×2, plus DST-safety handling) to correctly catch same-day payouts across summer/winter time changes, plus a broker-confirmed-payment notification layer added 2026-07-26.

---

## 3. Summary

| | Original scope (2026-07-11 quote basis) | Actual / current |
|---|---|---|
| **Price** | $100 agreed | $20 received via Fiverr; a separate $100 order placed on Upwork, not yet released. Repeated verbal offers to "pay more / tip" never converted into a revised written agreement |
| **Timeline basis** | 7–10 days | In active development since ~2026-07-14, still ongoing as of 2026-08-04 (3+ weeks) |
| **Design source** | Single prototype treated as final visual spec | Prototype UI rejected outright (2026-07-27) → hired designer → detailed Figma files now being handed over for a second full implementation pass |
| **Notifications** | OneSignal, 3 templates | OneSignal → rebuilt on Firebase Cloud Messaging, plus a separate selectable-style notification system and bell component |
| **Broker sync** | Plaid for Pro+ | Plaid + CSV import + manual-entry tiering + BR/international broker fallback matrix |
| **Landing page** | Reference link only | Fully custom-built marketing site |
| **Feedback rounds absorbed** | — | Two full rounds (2026-07-27 design rejection, 2026-07-31 functional review with 16 items, ~18 line-item details, most explicitly "not from the original list") |

The pattern across every category is the same: each item in the one-line prototype feature list (`collections`, `push notifications`, `broker sync`, `calendar`) turned out, once actually specified or reviewed by the client, to carry several times the implementation surface implied by its name in the original conversation — and the visual design, treated at the outset as already-finished (the prototype), has now gone through one full rejection-and-rebuild cycle and is entering a second one via the Figma handoff.
