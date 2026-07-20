# PaidPrime

A dividend-tracking SaaS PWA. Its entire value proposition: the user finds out a dividend landed before their broker's own app tells them — via push notification, Telegram, and email.

- **Client:** Welson
- **Developer:** Mohammad Shuja Uddin
- **Live:** [divpulse-app.vercel.app](https://divpulse-app.vercel.app/) — moving to [paidprime.com](https://paidprime.com/) once the domain is connected

## Documentation

Read in this order before making product or architecture decisions:

| Doc | Covers |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, features, subscription tiers, success criteria |
| [`docs/services.md`](docs/services.md) | Every third-party service to register, its cost, and what it powers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, routing map, proposed data model, backend design, current implementation status, and open items |
| [`Design-System/`](Design-System/) | The full PaidPrime brand and component system — read `Design-System/SKILL.md` first |

## Current status

Built: landing page, Supabase-backed auth (email/password sign up + login, email confirmation), and the holdings tracker (manual add/remove, dashboard shell). Not yet started: any of the third-party integrations (Yahoo Finance, Plaid, OneSignal, Telegram, Stripe, AI provider) — zero API clients are installed, and there is no `app/api` route yet. See `docs/ARCHITECTURE.md` §14 for the authoritative built-vs-proposed breakdown; keep that section updated as the build progresses rather than trusting this summary.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix primitives) · Supabase (Postgres, Auth) · Vercel

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

Required now that Supabase auth is wired in:

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client/server SDK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client/server SDK |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side calls (`lib/supabase/admin.ts`) |
| `NEXT_PUBLIC_SITE_URL` | Auth email redirect links (signup confirmation, OAuth callback) |
| `CRON_SECRET` | Reserved for the dividend-detection cron route — provisioned, not yet used in code |

Everything else the product will eventually need (Stripe, OneSignal, Plaid, Telegram, Resend, AI provider) is documented in `docs/ARCHITECTURE.md` §11 — none of those are wired up yet.

## Project structure

```
app/
  (auth)/             Login, signup, signup confirmation — Supabase email/password
  (dashboard)/        Authenticated app shell — dashboard home, holdings CRUD
  auth/callback/      Supabase auth callback route
  page.tsx, layout.tsx, globals.css, kit.css, manifest.ts, icons   PWA shell + landing page
components/
  auth/               Login/signup form
  dashboard/          App shell, holdings table, add/remove holding dialogs
  marketing/          Landing page sections
  ui/                 shadcn/ui primitives, re-themed to PaidPrime tokens
lib/
  supabase/           Client, server, and admin Supabase helpers
  utils.ts            cn() classname helper
supabase/migrations/  Schema: profiles/subscriptions, holdings
Design-System/        Canonical brand/design source — tokens, component kit, icons
docs/                 Product requirements, services reference, architecture document
Prototype/            Static HTML prototypes (landing page + app shell) used as IA/UX reference
scripts/              Build-time tooling (icon generation)
proxy.ts              Route protection — Next.js 16's replacement for middleware.ts; redirects
                      unauthenticated visitors away from dashboard routes
```

## Design system

PaidPrime ships dark-only, styled through a three-layer system: design tokens (`app/globals.css` `:root`) → Tailwind theme mapping (`@theme inline`, closed-world color palette) → a preserved component kit (`app/kit.css`). shadcn/ui components are re-themed on top rather than left on their defaults. Don't introduce colors, radii, or spacing values outside what's documented in `Design-System/DESIGN.md` — that file is the source of truth, not this README.
