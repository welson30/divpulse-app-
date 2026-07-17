---
name: paidprime-design-system
description: Dark-theme design system for PaidPrime, a dividend income dashboard for dividend investors. Use whenever generating or editing any PaidPrime surface — dashboard screens, marketing pages, or component work — so color, type, spacing, and component rules stay consistent with the approved brand.
user-invocable: true
---

# PaidPrime design system — agent instructions

## What is inside

This package is a complete, source-backed Claude Design skill for the PaidPrime brand: an authoritative design reference (`DESIGN.md`), a canonical color/type/radius stylesheet (`colors_and_type.css`), a preserved production component kit (`kit/`), extracted brand icons (`build/icons/`), seven focused review previews (`preview/`), and an applied interface kit with real product screens (`ui_kits/app/`). Nothing here is a generic direction — every token and rule traces back to `brand-spec.md`, `design-system.html`, and `kit/` as documented in `context/provenance.md`.

## Source context

PaidPrime is a dividend income dashboard for dividend investors, positioned as "quiet confidence" — a third lane between spreadsheet-cold and consumer-cute financial tools. The source evidence (`brand-spec.md`, a full documentation page `design-system.html`, and a reusable `kit/`) was supplied directly as a complete, approved brand brief — not inferred. Read `context/provenance.md` for the exact evidence-to-artifact mapping and open blockers (no self-hosted font binaries; the logo-asset blocker was resolved 2026-07-15, see `assets/README.md`).

## When to use

Use this skill whenever the task touches the PaidPrime brand: dashboard screens, holdings/portfolio views, dividend alerts, marketing pages, or any new component. Treat its tokens and rules as fixed, not as a starting point to riff on.

## How to use

### Read order

1. **`DESIGN.md`** — the full system (12 sections: source context, theme, color, type, spacing, layout, components, motion, voice, light/dark policy, implementation notes, anti-patterns). Read in full before writing any markup.
2. **`colors_and_type.css`** — canonical color + type + radius tokens, including a `--role-*` semantic layer (§2 "Token roles") aliased on top of the raw palette. Paste verbatim into the first `<style>` block (or `<link>` it) before writing layout, and prefer `--role-*` names in new code.
3. **`kit/tokens.css`** — same tokens plus spacing (`--sp-1`…`--sp-8`). Use this instead of / alongside `colors_and_type.css` whenever the surface needs spacing tokens too.
4. **`kit/components.css`** — real, already-approved component classes (buttons, icon buttons, badges, holding card, dividend receipt, empty/loading/error states, type utilities). Prefer reusing these classes over inventing new ones.
5. **`ui_kits/app/`** — reference for how the tokens and components compose into real screens (Dashboard, Holdings, Alerts). Match this layout vocabulary for new screens rather than inventing a new shell.

### Binding tokens (do this first, every time)

```html
<link rel="stylesheet" href="colors_and_type.css">
<link rel="stylesheet" href="kit/tokens.css">
<link rel="stylesheet" href="kit/components.css">
<script src="kit/interactions.js"></script>
```

Do not invent hex values, spacing numbers, or radii outside these files. If a new value seems necessary, derive it with `color-mix()` or `oklch()` from an existing token rather than introducing a new literal.

## Design-System Highlights

Every rule below is grounded in source evidence (`brand-spec.md`, `design-system.html`, `kit/`), not invented:

- **Primary buttons: `--green-500` fill with `--bg-base` (dark) text — never white-on-green.** Deliberate, higher-contrast, premium choice (`brand-spec.md` §Components).
- **Destructive buttons: `--red-500` outline only, never filled.** Solid red is reserved for loss data (`brand-spec.md` §Components).
- **`--text-tertiary` is decorative-only** — it measures 3.4–4.9:1 across the four backgrounds, clearing the 4.5:1 AA floor on `--bg-base` alone and failing it on every other surface (`kit/README.md` known-constraint note). Use `--text-secondary` for any real label, timestamp, or caption.
- **No drop shadows for elevation** — layered lightness (`--bg-base` → `--bg-surface` → `--bg-elevated`) plus a 1px `--border-subtle` edge instead (`brand-spec.md` §Elevation).
- **Icon buttons are icon-only, no text label**; on screens ≤480px reposition the label above the icon instead of removing it (`brand-spec.md` §Iconography, confirmed as a standing cross-project preference).
- **Green signals something** (gain, primary action, active state) — never generic decoration.
- **A logo mark now exists** (`assets/logo.svg`, supplied 2026-07-15) — use it unresized and unrecolored; see `assets/README.md`. The old "reserve an empty slot, do not invent one" rule was for the prior no-logo period, not a standing instruction to avoid the mark now that one is supplied.
- **Every data module needs empty / loading / error states** (`kit/components.css` `.state-card` variants) — observed pattern in `design-system.html`.
- **The dividend receipt card is the only component with a designed entrance + count-up animation** (`kit/interactions.js`). Don't add competing motion elsewhere.
- **Respect `prefers-reduced-motion`** on any animation you add — every animation in source evidence has a reduced-motion fallback.
- **PaidPrime is dark-only by deliberate policy, not a gap** — no light-mode tokens exist and none should be invented ad hoc; see `DESIGN.md` §10 before ever adding `prefers-color-scheme: light` handling.
- **Prefer `--role-*` semantic tokens over raw palette tokens** in new code (`--role-cta-bg` instead of `--green-500` when you mean "the CTA color") — see `DESIGN.md` §2 "Token roles" and §11 "Implementation Notes."
- **Interactive-control borders use `--text-tertiary` (`--role-border-interactive`), never `--border-subtle`.** `--border-subtle` measures ~1.1–1.5:1 against every background — it fails WCAG 1.4.11 for buttons/inputs/icon-buttons. Fixed package-wide in a 2026-07-14 audit; see `DESIGN.md` §2 and §12.

## Component quick-reference

| Need | Class(es) | Source |
|---|---|---|
| Primary/secondary/destructive button | `.btn .btn-primary` / `.btn .btn-secondary` / `.btn .btn-destructive` | `kit/components.css` |
| Icon-only button | `.icon-btn` (+ `.is-active`) | `kit/components.css` |
| Status pill | `.badge .badge-info` / `.badge .badge-warning` | `kit/components.css` |
| Portfolio holding row | `.holding-card` | `kit/components.css` |
| Dividend payment moment | `.receipt` + `[data-receipt]` + `interactions.js` | `kit/components.css`, `kit/interactions.js` |
| Empty / loading / error module | `.state-card` (+ `.error-card`) | `kit/components.css` |
| Display/H1/H2/body/small type | `.dp-text-*` (`colors_and_type.css`) or `.text-*` (`kit/components.css`) | either |

## Checklist before shipping a PaidPrime surface

- [ ] Tokens bound from `colors_and_type.css` + `kit/tokens.css` — no ad-hoc hex/px values.
- [ ] Primary CTA uses dark text on green; destructive is outline-only.
- [ ] No `--text-tertiary` on timestamps, captions, or table headers.
- [ ] Icon buttons have no visible text label (desktop) and a repositioned label ≤480px.
- [ ] Financial figures use tabular numerals and a visible sign (`+$46.20`, not `46.20`).
- [ ] Every data list/card has an empty, loading, and error variant defined or reused.
- [ ] Logo area uses the real mark (`assets/logo.svg`), unresized and unrecolored.
- [ ] New animation (if any) has a `prefers-reduced-motion` fallback.
- [ ] Interactive-control borders (buttons, inputs, icon buttons) use `--text-tertiary`, not `--border-subtle`.
- [ ] Every focusable element has a visible focus style — never `outline: none` without a replacement.

See `README.md` for the full file map and reuse workflow, and `context/provenance.md` for how each artifact traces back to source evidence.
