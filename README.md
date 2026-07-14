# DivPulse

A dividend-tracking SaaS PWA. Its entire value proposition: the user finds out a dividend landed before their broker's own app tells them — via push notification, Telegram, and email.

- **Client:** Welson
- **Developer:** Mohammad Shuja Uddin
- **Live:** [divpulse-app.vercel.app](https://divpulse-app.vercel.app/)

## Documentation

Read in this order before making product or architecture decisions:

| Doc | Covers |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, features, subscription tiers, success criteria |
| [`docs/services.md`](docs/services.md) | Every third-party service to register, its cost, and what it powers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, routing map, proposed data model, backend design, current implementation status, and open items |
| [`Design-System/`](Design-System/) | The full DivPulse brand and component system — read `Design-System/SKILL.md` first |

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix primitives) · Supabase (Postgres, Auth, Storage — not yet connected) · Vercel

See `docs/ARCHITECTURE.md` §4 for the full stack table and §14 for what's actually built versus still proposed.

## Getting started

```bash
pnpm install
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

None are required yet — no third-party integration is wired up in code. The full list this project will eventually need (Supabase, Stripe, OneSignal, Plaid, Telegram, Resend, AI provider) is documented in `docs/ARCHITECTURE.md` §11, with a note on which are already required versus pending an open decision.

## Project structure

```
app/                  Next.js App Router — pages, layout, global styles, PWA metadata files
components/ui/        shadcn/ui components, re-themed to DivPulse tokens
lib/                  Shared utilities (currently just the cn() classname helper)
Design-System/        Canonical brand/design source — tokens, component kit, icons, applied UI reference
docs/                 Product requirements, services reference, architecture document
Prototype/            Static HTML prototypes (landing page + app shell) used as IA/UX reference
scripts/              Build-time tooling (icon generation)
```

## Design system

DivPulse ships dark-only, styled through a three-layer system: design tokens (`app/globals.css` `:root`) → Tailwind theme mapping (`@theme inline`, closed-world color palette) → a preserved component kit (`app/kit.css`). shadcn/ui components are re-themed on top rather than left on their defaults. Don't introduce colors, radii, or spacing values outside what's documented in `Design-System/DESIGN.md` — that file is the source of truth, not this README.
