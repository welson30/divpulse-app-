# DivPulse — Design System Package

A dark-theme design system for **DivPulse**, a dividend income dashboard for dividend investors. Positioning: quiet confidence — the third lane between spreadsheet-cold and consumer-cute. Extracted and packaged from a source project that already contained a complete brand brief, a full documentation surface, and a reusable component kit — see `context/provenance.md` for the exact evidence-to-artifact mapping.

## Product Overview

**Product:** DivPulse is a web application that provides dividend investors with a single dashboard for dividend income — holdings, an incoming-payment calendar, portfolio diversification, and a feed of dividend payments as they land.

**Primary surfaces:**
- **Dashboard** — portfolio total value, dividend calendar chart, diversification chart, recent dividends feed, top holdings preview.
- **Holdings** — full position table (ticker, company, shares, price, change, yield) with live search.
- **Dividend Alerts** — the full payment feed, filterable All / Unread. Each payment renders as a "receipt" card — the one component in the system that carries brand personality.

**Core capability the visual system protects:** trust. Dark canvas signals a serious tool; one restrained green signals growth without hype; the receipt card's entrance + count-up animation is the single moment of delight, deliberately not repeated elsewhere. Read `DESIGN.md` §1 for the full rationale.

Read `DESIGN.md` first — it's the authoritative reference for color, type, spacing, layout, components, motion, voice, and anti-patterns. Everything else in this package is either generated from it or preserved source evidence.

## Package contents / file map

```
DESIGN.md                  ← authoritative design reference (12 sections)
README.md                  ← this file
SKILL.md                   ← agent-facing Claude Design skill (what/when/how to use)
colors_and_type.css        ← canonical color + type + radius distributable (package entry point)
style-guide.html           ← shareable, printable design + component guide (Share → PDF for a handoff PDF)
brand-spec.md               ORIGINAL source brief (preserved, canonical for hex values)
design-system.html          ORIGINAL full documentation page (preserved source example)

context/
  source-context.md        ← handoff record from the source project
  provenance.md              evidence → artifact mapping, decisions, open blockers

kit/                         ORIGINAL reusable implementation kit (preserved)
  tokens.css                   full token set: color + type + spacing + radii
  components.css               real product component classes
  interactions.js              receipt entrance + count-up behavior
  preview.html                 original component gallery
  README.md                    original kit usage notes

build/icons/                ← 8 runtime icon SVGs extracted from design-system.html
                               (growth, alerts, diversification, calendar, holdings,
                               settings, state-empty, state-error)

assets/
  README.md                 ← documents the logo gap — no mark was supplied in source evidence

preview/                    ← 7 focused review cards, one concern per file (manifest below)

ui_kits/app/                ← applied interface kit — real DivPulse product screens
  index.html                   Dashboard
  holdings.html                Holdings
  alerts.html                  Dividend alerts / notifications
  app.css                      page-level layout (sidebar, shell) — not component styles
  README.md
```

## Preview Manifest

What to inspect and in what order:

| # | File | Concern | Loads live from |
|---|---|---|---|
| 01 | `preview/colors-primary.html` | Backgrounds, green scale, red (loss-only), neutrals, semantic accents | `kit/tokens.css` |
| 02 | `preview/typography-specimens.html` | Display/H1/H2/body/small scale, tabular numerals | `kit/tokens.css`, `kit/components.css` |
| 03 | `preview/spacing-tokens.html` | 8px base-unit ruler + token reference table | `kit/tokens.css` |
| 04 | `preview/radius-shadows.html` | Two radius tokens, layered-lightness elevation, primary-CTA glow | `kit/tokens.css`, `kit/components.css` |
| 05 | `preview/components-buttons.html` | Buttons, icon buttons, badges, holding card, dividend receipt, empty/loading/error states | `kit/tokens.css`, `kit/components.css`, `kit/interactions.js` |
| 06 | `preview/brand-assets.html` | Reserved logo slot + the 8 preserved icon SVGs | `build/icons/*.svg` |
| 07 | `preview/applied-ui.html` | The system on real screens — embeds Dashboard, Holdings, Alerts live | `ui_kits/app/*.html` |

Start at `preview/index.html` — it links all seven cards. Then open `ui_kits/app/index.html` to see the system applied to a full product screen.

## Shareable Design Guide (PDF)

`style-guide.html` is a 14-page printable design + component guide — cover, contents, positioning, color, typography, spacing/radius, buttons/controls, cards/data, charts, states, motion/voice/accessibility, applied-UI overview, and implementation notes. It renders the real, current `kit/` component classes (not a re-described mockup), so it stays accurate as the kit evolves. Open it and use the browser's Share/Print → Save as PDF to produce a shareable handoff document — it uses the same tested multi-page print pipeline as Open Design's slide decks.

## Reuse Workflow

1. **Review** — open `preview/index.html`, work through cards 01–07, then `ui_kits/app/index.html` for the applied product. For a shareable summary, open `style-guide.html` instead.
2. **Reuse in a new surface** — read `SKILL.md`'s read order, bind `colors_and_type.css` + `kit/tokens.css` + `kit/components.css` + `kit/interactions.js`, then compose new markup from `kit/components.css` classes (see the component quick-reference in `SKILL.md`).
3. **Check before shipping** — run the checklist in `SKILL.md` (dark-on-green primary buttons, outline-only destructive, no `--text-tertiary` on real text, icon-only nav, tabular financial figures, empty/loading/error states present, reserved logo slot, reduced-motion fallback on any new animation).
4. **If the brand changes** — update `brand-spec.md` first, then `kit/tokens.css`, then `colors_and_type.css`, then the swatches in `design-system.html` — in that order (see `kit/README.md`).

## Preserved source assets

- **Logos/imagery:** none supplied in source evidence — see `assets/README.md` for the reserved empty-slot pattern used everywhere instead of an invented mark.
- **Icons:** 8 SVGs preserved in `build/icons/`, extracted verbatim from `design-system.html`.
- **Fonts:** no self-hosted binaries in source evidence — Inter Tight / Inter / JetBrains Mono load via Google Fonts `@import` in both `colors_and_type.css` and `kit/tokens.css`. See Known constraints below and `context/provenance.md`.
- **Source examples:** `design-system.html` (full original documentation surface) and the entire `kit/` folder are preserved unmodified as canonical source evidence, not just described in prose.

## Using this package

```html
<link rel="stylesheet" href="colors_and_type.css">     <!-- color + type + radius -->
<link rel="stylesheet" href="kit/tokens.css">           <!-- full tokens: adds spacing -->
<link rel="stylesheet" href="kit/components.css">       <!-- real component classes -->
<script src="kit/interactions.js"></script>             <!-- receipt entrance + count-up -->
```

`kit/tokens.css` remains the original preserved source of truth for the full token set (color + type + spacing + radii); `colors_and_type.css` is the lighter package-level entry point (color + type + radius) for consumers who don't need spacing. The two are kept in sync — see `context/provenance.md` for the reconciliation note.

## Known constraints

- **No logo supplied.** Every surface reserves an empty, labeled logo slot rather than inventing a mark — see `assets/README.md`.
- **`--text-tertiary` fails WCAG AA** at small sizes on dark backgrounds (~4.1:1). It is included in the tokens for completeness but restricted to decorative/demonstrative use — see `DESIGN.md` §2 and §12.
- **Fonts load via Google Fonts `@import`** in both `colors_and_type.css` and `kit/tokens.css`. This blocks render until fetched; self-host or preload for production. No font binaries were present in source evidence to package into `fonts/`.
- **Dark-only by design, no light mode.** DivPulse has never had light-mode tokens in source evidence; `DESIGN.md` §10 documents this as a deliberate brand decision and what would need re-verification (not just inversion) if a light mode is ever requested.

## Stronger token roles & reuse notes

`colors_and_type.css` now includes a `--role-*` semantic layer (e.g. `--role-cta-bg`, `--role-gain`, `--role-loss`, `--role-focus-ring`) aliased on top of the raw palette — prefer these in new code so intent reads at the call site. See `DESIGN.md` §2 "Token roles" for the full table and §11 "Implementation Notes" for import order, JS multi-instance behavior, and extension guidance.
