# PaidPrime — Brand & Design System Spec

Source: provided directly by the user as a complete brand brief (Branch A — treated as canonical; not a generic picked direction).

Color palette revised 2026-07-17 from a user-supplied brand-guide image. The
guide specified five colors (`#22C55E`, `#09090B`, `#1C1C1E`, `#A1A1AA`,
`#FFFFFF`); the remaining ramp steps are derived and marked below. Naming in
that guide predated the PaidPrime rename and was deliberately not applied —
color only.

## Positioning

Quiet confidence — the third lane between spreadsheet-cold (Bloomberg terminal) and cute-consumer (Robinhood cosplay). Dark canvas signals "serious tool," a pure-neutral ground keeps green as the only chromatic voice in the room, and generous whitespace signals trust in the data.

## Color tokens (hex is canonical for this brand — do not substitute or reinterpret)

### Backgrounds — layered depth, not flat black
- `--bg-base` `#09090B` — near-black, pure neutral (no undertone)
- `--bg-surface` `#1C1C1E` — cards, panels
- `--bg-elevated` `#252528` — modals, dropdowns, floating surfaces (derived)
- `--bg-hover` `#2C2C30` — hover state for interactive surfaces (derived)

### Primary green — brand / growth / positive
- `--green-500` `#22C55E` — core brand, primary CTA
- `--green-600` `#149141` — hover / pressed (derived)
- `--green-300` `#86EFAC` — highlights, subtle glow (derived)
- `--green-900` `#14532D` — chart fill tint, subtle backgrounds (derived)

`--green-600` is intentionally deeper than standard Tailwind green-600 (`#16A34A`). At `#16A34A` the hover was only ~1.5× darker than the `#22C55E` base — on the dark canvas it read as the same color. `#149141` is ~2× darker (a clearly perceptible hover step) while the dark CTA label on it still clears AA (4.9:1). Do not "correct" it back to `#16A34A`. The primary button hover binds to this token directly (`components/ui/button.tsx`), not to `primary` at reduced opacity.

### Red — reserved ONLY for negative/loss data, never decorative
- `--red-500` `#F87171`
- `--red-900` `#450A0A` — chart fill tint

### Neutrals — text hierarchy
- `--text-primary` `#FFFFFF` — headlines, key numbers
- `--text-secondary` `#A1A1AA` — labels, supporting text
- `--text-tertiary` `#7D7D85` — placeholder, disabled, timestamps (derived)
- `--border-subtle` `#303034` — hairline dividers (derived)

`--text-tertiary` is *not* the zinc-500 (`#71717A`) the rest of this ramp would
imply. It doubles as `--role-border-interactive`, and zinc-500 measures 2.88:1
on `--bg-hover` — under the 3:1 WCAG 1.4.11 floor for control boundaries.
`#7D7D85` is the nearest value clearing 3:1 on all four backgrounds
(3.41–4.87:1). Do not "correct" it back to a round zinc step.

### Semantic accents — sparing, never competing with green
- `--blue-info` `#60A5FA` — informational states, links, non-financial notices
- `--amber-warning` `#FBBF24` — warnings, expiring trials, action-needed

**Rule of thumb:** green appears only where it means something (gains, active states, primary buttons, success) — never generic decoration.

## Typography

- Display / numbers: **Inter Tight** (fallback: Inter, system-ui, sans-serif) — geometric, confident, for large dollar figures
- Body / UI: **Inter** — workhorse at small sizes for dense data
- Mono: **JetBrains Mono** (fallback: IBM Plex Mono, ui-monospace, monospace) — ticker symbols, table amounts; tabular-nums for column alignment

Scale: Display 40–48px/semibold · H1 28px/semibold · H2 20px/medium · Body 15px/regular · Small/meta 13px/regular (text-tertiary)

## Iconography

Outline, 1.5px stroke, rounded joins — not filled, not sharp. Default color `text-secondary`, shifts to `green-500` only on active/selected. Icon-only buttons, no text labels; label repositions above icon on small screens.

## Elevation & depth

No drop shadows on dark surfaces (invisible). Depth cue = layered lightness: base → surface → elevated. 1px `border-subtle` outline defines card edges. Optional faint green glow (`box-shadow: 0 0 24px rgba(34,197,94,0.08)`) behind primary CTA only.

## Components

- **Buttons** — primary: green-500 fill, bg-base text (dark-on-green, not white); secondary: transparent + border-subtle + text-primary label; destructive: red-500 outline only, never filled.
- **Cards** (holdings, dividend entries) — bg-surface, 1px border-subtle, 12–16px radius, 20–24px padding.
- **Dividend alert / "receipt" card** (core feature) — left-aligned ticker/logo, right-aligned mono amount, 2–3px green accent bar on the left edge ("money received"). Slide-up + fade entrance on new arrival.
- **Charts** — green gradient fill (green-500 → transparent) for growth visuals; grid lines at border-subtle only; mono data labels.

## Spacing

8px base unit: 8 / 16 / 24 / 32 / 48 / 64 — nothing arbitrary.

## Logo

Not supplied. Every layout reserves an empty, clearly labelled logo slot until one is provided — do not invent a mark.
