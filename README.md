# PaidPrime

A dividend-tracking SaaS PWA. Its entire value proposition: the user finds out a dividend landed before their broker's own app tells them — via push notification, Telegram, and email.

- **Client:** Welson
- **Developer:** Mohammad Shuja Uddin
- **Live:** [paidprime.com](https://paidprime.com/)

## Documentation

Read in this order before making product or architecture decisions:

| Doc | Covers |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, features, subscription tiers, success criteria |
| [`docs/services.md`](docs/services.md) | Every third-party service to register, its cost, and what it powers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, routing map, proposed data model, backend design, current implementation status, and open items |
| [`Design-System/`](Design-System/) | The full PaidPrime brand and component system — read `Design-System/SKILL.md` first |

## Current status

The product described in `docs/PRD.md` is built and live, not proposed. Supabase auth, the full dashboard (holdings, dividends, calendar, collections, watchlist, diversification, goals, analytics, per-ticker detail pages), the daily dividend-detection cron, Stripe billing (Free/Pro/Pro+), Plaid broker auto-sync (live in production, gated per-institution by Plaid), CSV import, push notifications (Firebase Cloud Messaging), Telegram alerts with per-user account linking, and the AI Advisor (implemented, dormant until `OPENAI_API_KEY` is provisioned) are all in code, not on a roadmap. See `docs/ARCHITECTURE.md` §14 for the fuller built-vs-proposed breakdown and `docs/SESSION_HANDOFF.md` for recent session-by-session work — keep both updated as the build progresses rather than trusting this summary.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix primitives) · Supabase (Postgres, Auth) · Vercel · Stripe · Plaid · Firebase Cloud Messaging · Telegram Bot API · Resend · Yahoo Finance (unofficial API)

See `docs/ARCHITECTURE.md` §4 for the full stack table and §14 for what's actually built versus still proposed.

## Getting started

```bash
pnpm install
```

Create a `.env.local` with the variables listed below, then:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
pnpm build   # production build
pnpm lint    # eslint
node scripts/generate-icons.mjs   # regenerate favicons/app icons/PWA manifest icons from public/logo.png
```

## Environment variables

See `.env` for the full list (gitignored — don't assume a fresh clone has it). Grouped by what they gate:

| Variable(s) | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase client/server SDK; service role for privileged calls (`lib/supabase/admin.ts`) |
| `NEXT_PUBLIC_SITE_URL` | Auth email redirect links, OAuth callback, canonical URL in metadata/OG tags |
| `CRON_SECRET` | Protects `/api/jobs/*` (dividend detection, Plaid sync, test-push) from unauthenticated invocation |
| `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `PLAID_WEBHOOK_URL` | Broker auto-sync (Pro+). `PLAID_ENV=sandbox` locally; Vercel production runs `production` (Welson-managed) |
| `ENCRYPTION_KEY` | AES-256-GCM encryption of `broker_connections.plaid_access_token` at rest |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_PRO_PLUS` | Billing — checkout, portal, webhook-driven plan sync |
| `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON` | Push notifications (Firebase Cloud Messaging — see `lib/firebase/`) |
| `TELEGRAM_BOT_TOKEN` | Per-user Telegram alerts (`lib/telegram/`, `/api/telegram/webhook`) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email |
| `NEXT_PUBLIC_LOGO_DEV_KEY` | Ticker/company logo fallback (`lib/tickers/logo.ts`) |
| `OPENAI_API_KEY` | AI Advisor — **not currently set**; `/api/advisor/query` returns 503 without it |
| `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Vestigial — push moved to Firebase; safe to ignore |

## Project structure

```
app/
  (auth)/             Login, signup, onboarding — Supabase email/password
  (dashboard)/        Authenticated app shell — dashboard, holdings, dividends, calendar,
                      collections, watchlist, diversification, goals, analytics, brokers,
                      advisor, alert-templates, notifications, settings, tickers/[ticker],
                      performance, upcoming, history, help
  api/                Route handlers — jobs (cron), plaid, stripe, webhooks, telegram, advisor
  auth/callback/      Supabase auth callback route
  page.tsx            The live marketing homepage (see app/homepage/ below)
  homepage/           Archived "coming soon" waitlist gate — not currently linked anywhere;
                      app/page.tsx and app/homepage/page.tsx have swapped roles more than once
                      as launch timing changed, kept rather than deleted each time
  layout.tsx, globals.css, kit.css, manifest.ts, icons   PWA shell
components/
  auth/               Login/signup/sign-in forms
  dashboard/          App shell, tables, dialogs for every dashboard route
  marketing/          Homepage sections (hero, pricing, FAQ, etc.)
  ui/                 shadcn/ui primitives, re-themed to PaidPrime tokens
lib/
  supabase/           Client, server, and admin Supabase helpers
  plaid/, stripe/, telegram/, firebase/, resend/, advisor/, crypto/, csv/   Per-integration logic
  tickers/            Yahoo Finance enrichment, search, logos, sparklines, yield/performance math
  dividend-data/      Income aggregation from dividend_events/dividend_payments
  notifications/, help/   Shared helpers for those features
  utils.ts            cn() classname helper
supabase/migrations/  Full schema — profiles, subscriptions, holdings, dividend_events/payments,
                      watchlist, collections, goals, broker_connections, telegram_links,
                      notification_preferences, pg_cron jobs, and more (20 migrations as of
                      2026-08-23)
Design-System/        Canonical brand/design source — tokens, component kit, icons
docs/                 Product requirements, services reference, architecture document, and
                      dated session/handoff/scope records (see docs/SESSION_HANDOFF.md first)
Prototype/            Static HTML prototypes (landing page + app shell) used as original IA/UX
                      reference — superseded by the real routes above, kept for history
scripts/              Build-time tooling (icon generation)
proxy.ts              Route protection — Next.js 16's replacement for middleware.ts; redirects
                      unauthenticated visitors away from dashboard routes
```

## Design system

PaidPrime ships dark-only, styled through a three-layer system: design tokens (`app/globals.css` `:root`) → Tailwind theme mapping (`@theme inline`, closed-world color palette) → a preserved component kit (`app/kit.css`). shadcn/ui components are re-themed on top rather than left on their defaults. Don't introduce colors, radii, or spacing values outside what's documented in `Design-System/DESIGN.md` — that file is the source of truth, not this README.
