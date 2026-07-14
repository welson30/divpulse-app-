# DivPulse — Brand & Design System Spec

Source: provided directly by the user as a complete brand brief (Branch A — treated as canonical; not a generic picked direction).

## Positioning

Quiet confidence — the third lane between spreadsheet-cold (Bloomberg terminal) and cute-consumer (Robinhood cosplay). Dark canvas signals "serious tool," restrained green signals growth without shouting, generous whitespace signals trust in the data.

## Color tokens (hex is canonical for this brand — do not substitute or reinterpret)

### Backgrounds — layered depth, not flat black
- `--bg-base` `#0A0E0D` — near-black, whisper of green undertone
- `--bg-surface` `#121816` — cards, panels
- `--bg-elevated` `#1A211E` — modals, dropdowns, floating surfaces
- `--bg-hover` `#1E2724` — hover state for interactive surfaces

### Primary green — brand / growth / positive
- `--green-500` `#34D399` — core brand, primary CTA
- `--green-600` `#10B981` — hover / pressed
- `--green-300` `#6EE7B7` — highlights, subtle glow
- `--green-900` `#064E3B` — chart fill tint, subtle backgrounds

### Red — reserved ONLY for negative/loss data, never decorative
- `--red-500` `#F87171`
- `--red-900` `#450A0A` — chart fill tint

### Neutrals — text hierarchy
- `--text-primary` `#F5F7F6` — headlines, key numbers
- `--text-secondary` `#A8B3AF` — labels, supporting text
- `--text-tertiary` `#6B7570` — placeholder, disabled, timestamps
- `--border-subtle` `#242C29` — hairline dividers

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

No drop shadows on dark surfaces (invisible). Depth cue = layered lightness: base → surface → elevated. 1px `border-subtle` outline defines card edges. Optional faint green glow (`box-shadow: 0 0 24px rgba(52,211,153,0.08)`) behind primary CTA only.

## Components

- **Buttons** — primary: green-500 fill, bg-base text (dark-on-green, not white); secondary: transparent + border-subtle + text-primary label; destructive: red-500 outline only, never filled.
- **Cards** (holdings, dividend entries) — bg-surface, 1px border-subtle, 12–16px radius, 20–24px padding.
- **Dividend alert / "receipt" card** (core feature) — left-aligned ticker/logo, right-aligned mono amount, 2–3px green accent bar on the left edge ("money received"). Slide-up + fade entrance on new arrival.
- **Charts** — green gradient fill (green-500 → transparent) for growth visuals; grid lines at border-subtle only; mono data labels.

## Spacing

8px base unit: 8 / 16 / 24 / 32 / 48 / 64 — nothing arbitrary.

## Logo

Not supplied. Every layout reserves an empty, clearly labelled logo slot until one is provided — do not invent a mark.
