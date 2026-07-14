# DivPulse — Design System

> Category: Project Design System
> Surface: web (responsive dashboard)
> Source: extracted from the "Design System Use Your Design Skills" project (52ce145b-1468-4086-ae01-330d8c7fd755) — a complete brand brief (`brand-spec.md`), a full documentation surface (`design-system.html`), and a reusable component kit (`kit/`) were provided directly as canonical evidence, not inferred from a generic direction.

## 0. Product Context & Source Evidence

**Product:** DivPulse — a dividend income dashboard used by dividend investors to track holdings, dividend calendars, portfolio diversification, and incoming dividend payments. This is a data product (financial dashboard), not a marketing site.

**Primary surfaces:** Dashboard (portfolio summary), Holdings (full position list), Dividend Alerts (payment feed). See `ui_kits/app/` for the applied implementation of all three.

**Evidence used to write every section below** (full mapping in `context/provenance.md`):

| Section | Backed by |
|---|---|
| §1 Visual Theme | `brand-spec.md` positioning statement |
| §2 Color | `brand-spec.md` color token table (canonical hex); cross-checked against the live swatches in `design-system.html` and `kit/tokens.css` |
| §3 Typography | `brand-spec.md` typography section; cross-checked against `design-system.html`'s type specimen and `kit/tokens.css` scale variables |
| §4 Spacing | `brand-spec.md` spacing scale; cross-checked against `design-system.html`'s spacing ruler and `kit/tokens.css` `--sp-*` / `--radius-*` tokens |
| §5 Layout | `design-system.html` structural CSS (container widths, breakpoints, grid patterns) |
| §6 Components | `design-system.html` rendered components + `kit/components.css` production classes (same components, cross-verified to match) |
| §7 Motion | `design-system.html` inline script + `kit/interactions.js` (generalized version of the same entrance/count-up behavior) |
| §8 Voice | Copy tone observed directly in `design-system.html` (philosophy panel, state-card copy, timestamp formatting) |
| §9 Anti-patterns | Derived from explicit rules stated in `brand-spec.md` (e.g. "never filled" destructive buttons, "do not invent a mark") plus constraints documented in `kit/README.md` (the `--text-tertiary` WCAG note) |
| §10 Light/Dark Mode Policy | Policy inference, not directly evidenced — no light-mode markup or tokens exist anywhere in source evidence. Built from the explicit dark-canvas rule in `brand-spec.md` §Positioning plus the closed-world token list (nothing to invert against). Flagged here so this section is never mistaken for observed evidence. |
| §11 Implementation Notes | Synthesized from patterns already implemented in `kit/tokens.css`, `kit/components.css`, and `kit/interactions.js` (import order, reduced-motion handling, multi-instance JS) — not new decisions, just made explicit for reuse |

Nothing in this document is invented or picked from a generic direction library — every rule traces to one of the evidence files above; §10 is explicitly marked as policy inference rather than observed evidence.

## 1. Visual Theme & Atmosphere

DivPulse is a dark-theme dividend income dashboard for dividend investors. The positioning is **quiet confidence** — a deliberate third lane between two failure modes: spreadsheet-cold (Bloomberg-terminal density with no warmth) and consumer-cute (Robinhood-style confetti and mascot energy). Financial dashboards that go too far in either direction lose the user's trust.

The system leans on three signals working together:
- **Dark canvas** → this is a serious tool, not a toy.
- **One restrained growth green**, used only where it means something → confidence without shouting.
- **Generous whitespace and an 8px rhythm** → the interface trusts the data enough not to decorate it.

The one component that is allowed to carry personality is the **dividend "receipt" card** — the moment a payment lands. Everything else in the system stays quiet specifically so that moment can feel earned.

## 2. Color

Hex values are canonical (source: `brand-spec.md`) — do not substitute or reinterpret them, and do not introduce colors outside this palette.

### Backgrounds — layered depth, never flat black
| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#0A0E0D` | Page canvas — near-black with a whisper of green undertone |
| `--bg-surface` | `#121816` | Cards, panels |
| `--bg-elevated` | `#1A211E` | Modals, dropdowns, floating surfaces |
| `--bg-hover` | `#1E2724` | Hover state for interactive surfaces |

### Primary green — brand / growth / positive
| Token | Hex | Role |
|---|---|---|
| `--green-500` | `#34D399` | Core brand, primary CTA fill |
| `--green-600` | `#10B981` | Hover / pressed state |
| `--green-300` | `#6EE7B7` | Highlights, subtle glow |
| `--green-900` | `#064E3B` | Chart fill tint, subtle backgrounds |

### Red — reserved exclusively for negative/loss data
| Token | Hex | Role |
|---|---|---|
| `--red-500` | `#F87171` | Loss figures, destructive action outline |
| `--red-900` | `#450A0A` | Chart fill tint for losses |

Red is never used decoratively. It reports a loss or a destructive action — nothing else.

### Neutrals — text hierarchy
| Token | Hex | Role | Contrast on `--bg-base` |
|---|---|---|---|
| `--text-primary` | `#F5F7F6` | Headlines, key numbers | ~18.5:1 |
| `--text-secondary` | `#A8B3AF` | Labels, supporting text, timestamps, captions | ~9:1 |
| `--text-tertiary` | `#6B7570` | Decorative/demonstrative use only | ~4.1:1 |
| `--border-subtle` | `#242C29` | Hairline dividers, card edges | — |

**Accessibility constraint (binding):** `--text-tertiary` measures only ~4.1:1 against dark backgrounds at small sizes — under the 4.5:1 AA floor for normal text. Never use it for meaningful small text (timestamps, table headers, captions, labels). Use `--text-secondary` (~9:1) for anything a user needs to reliably read. `--text-tertiary` is reserved for purely decorative or demonstrative use.

**Non-text contrast constraint (binding, found in the 2026-07-14 audit):** `--border-subtle` measures only ~1.1–1.4:1 against every background token — nowhere near the 3:1 WCAG 1.4.11 floor for boundaries of essential UI components. It stays fine for structural/decorative dividers (card edges, table row lines) where spacing and background grouping carry the real signal, but it must never be the *only* boundary indicator on an interactive control. Use `--text-tertiary` (~3.4–4.1:1, aliased as `--role-border-interactive`) for button and input borders instead — this is not a new pattern, `design-system.html`'s own `.swatch:hover` already uses `--text-tertiary` as its stronger-emphasis border. Also note: the whole layered-lightness elevation model (`--bg-base` → `--bg-surface` → `--bg-elevated` → `--bg-hover`) is only ~1.1–1.2:1 fill-to-fill — surfaces are barely distinguishable by background alone, so borders and spacing are load-bearing for perceiving structure, not decorative extras. Never remove a card/panel border to "clean up" a layout; use spacing instead if a lighter feel is wanted.

### Semantic accents — sparing, never competing with green
| Token | Hex | Role |
|---|---|---|
| `--blue-info` | `#60A5FA` | Informational states, links, non-financial notices |
| `--amber-warning` | `#FBBF24` | Warnings, expiring trials, action-needed |

**Rule of thumb:** green appears only where it means something — gains, active states, primary buttons, success. It is never generic decoration.

### Token roles (semantic layer)

Raw palette tokens (`--green-500`, `--text-secondary`, …) describe *what the color is*. Role tokens describe *what it's for* — an intent layer aliased on top, added in `colors_and_type.css`, that resolves to the same raw tokens without introducing new hex values:

| Role token | Resolves to | Use for |
|---|---|---|
| `--role-bg-canvas` | `--bg-base` | Page/app background |
| `--role-bg-surface-1` | `--bg-surface` | Cards, panels |
| `--role-bg-surface-2` | `--bg-elevated` | Modals, dropdowns |
| `--role-cta-bg` / `--role-cta-fg` | `--green-500` / `--bg-base` | Primary button fill/text |
| `--role-gain` / `--role-loss` | `--green-500` / `--red-500` | Financial up/down figures |
| `--role-text-label` | `--text-secondary` | Timestamps, captions, table headers |
| `--role-text-decorative` | `--text-tertiary` | Decorative-only — never real content |
| `--role-border` | `--border-subtle` | Structural/decorative dividers — card edges, table rows |
| `--role-border-interactive` | `--text-tertiary` | Button/input/icon-button borders — `--border-subtle` fails WCAG 1.4.11 here |
| `--role-focus-ring` | `--green-500` | `:focus-visible` / `:focus-within` outline or border |

Prefer role tokens in new code — they read as intent at the call site and make future re-theming safer (change what `--role-cta-bg` points to in one place instead of hunting every `--green-500` usage to see which ones meant "brand" versus "CTA"). `kit/components.css` is preserved source and intentionally still references raw tokens directly; that's fine — don't retrofit it, just prefer roles going forward.

## 3. Typography

| Role | Family | Fallback stack |
|---|---|---|
| Display / numbers | **Inter Tight** | Inter, system-ui, sans-serif |
| Body / UI | **Inter** | system-ui, -apple-system, sans-serif |
| Mono (tickers, table amounts) | **JetBrains Mono** | IBM Plex Mono, ui-monospace, Menlo, monospace |

Loaded via Google Fonts `@import` in the current kit (`Inter Tight:500,600,700`, `Inter:400,500,600`, `JetBrains Mono:400,500,600`). For production, self-host or `<link rel="preload">` with `font-display: swap` instead of relying on the blocking `@import` — see `context/provenance.md` for the open item.

### Type scale
| Role | Size / weight | Family |
|---|---|---|
| Display (hero numbers) | 40–48px (`clamp(40px,4vw,48px)`) / 600 | Inter Tight |
| H1 (page titles) | 28px / 600 | Inter Tight |
| H2 (section headers) | 20px / 500 | Inter Tight |
| Body | 15px / 400 | Inter |
| Small / meta (timestamps, labels) | 13px / 400, `--text-tertiary`-eligible only when non-critical | Inter |

**Tabular numbers:** every column of financial figures uses `font-variant-numeric: tabular-nums` (mono or Inter with tabular figures) so amounts align vertically. Never let dollar figures use proportional numerals in a table or list.

Letter-spacing: display/H1 use `-0.01em` to `-0.02em` for a tightened, confident feel; body copy uses default tracking.

## 4. Spacing

8px base unit — nothing arbitrary: **8 / 16 / 24 / 32 / 48 / 64** (`--sp-1` … `--sp-8`).

Radii: `--radius-control: 10px` (buttons, icon buttons), `--radius-card: 14px` (cards, panels, states). The cover/hero panel and logo slot use a slightly larger 16px for visual distinction as the top-level brand container.

Dense dashboards live or die on consistent rhythm — never introduce a spacing value outside this scale, and never mix `px` ad-hoc values into component padding.

## 5. Layout & Composition

- **Max content width:** 1180px container for documentation/marketing-style pages; dashboard app screens use full-bleed with a fixed sidebar/topbar and an inner content max-width appropriate to the module (holdings tables can run wider than card grids).
- **Navigation:** sticky topbar, 64px height, blurred glass background (`rgba(10,14,13,0.86)` + `backdrop-filter: blur(10px)`), bottom hairline border. On product screens (not the documentation page), pair with icon-only primary navigation.
- **Grids:** card rows use `repeat(auto-fill, minmax(150px,1fr))` for swatch/token grids, `1fr 1fr` two-up for holdings/chart pairs, `repeat(3,1fr)` for state triads — all collapsing to a single column at `max-width:760px`.
- **Responsive breakpoints observed in source:** 760px (grid collapse, nav hides), 480px (container padding tightens, receipt card compresses). Extend this system to standard breakpoints (360 / 390–430 / 600–744 / 768–834 / 1024–1180 / 1280–1366 / 1440–1536 / 1920) when building new screens — the source only demonstrates two.
- **Density:** this is a data product. Prioritize legible density over airy marketing whitespace once inside the app shell; reserve the most generous spacing for the top-level dashboard summary, tighten progressively as content becomes tabular.

## 6. Components

### Buttons
- **Primary** — `--green-500` fill, **`--bg-base` (dark) text — not white-on-green.** This is a deliberate, higher-contrast, more premium choice. Hover shifts fill to `--green-600`. Carries a faint green glow (`box-shadow: 0 0 24px rgba(52,211,153,0.08)`) reserved for primary CTAs only.
- **Secondary** — transparent fill, **`--text-tertiary` outline** (`--role-border-interactive` — not `--border-subtle`, which fails WCAG 1.4.11 at this default-state weight; see §2), `--text-primary` label. Hover fills with `--bg-hover`.
- **Destructive** — `--red-500` outline only, **never filled**. Solid red is reserved for actual loss data, not UI chrome. Hover adds a faint `rgba(248,113,113,0.08)` wash.
- **Disabled** — 40% opacity, no transform on press.
- Radius `--radius-control` (10px), 11px/20px padding, 14px/500 label.

### Icon-only buttons (standing preference)
No text labels on icon buttons anywhere in the system. Outline icons, 1.5px stroke, rounded joins — never filled, never sharp corners. Default stroke `--text-secondary`, shifts to `--green-500` only on active/selected. Border is `--text-tertiary` (`--role-border-interactive`), same WCAG 1.4.11 reasoning as secondary buttons. 44×44px minimum hit target. **On small screens (≤480px), reposition the label above the icon rather than removing it** — do not silently drop the label entirely.

### Cards
- **Holdings card** — `--bg-surface`, 1px `--border-subtle`, 14px radius, 24px padding. Ticker (mono, 600/15px) + company name left; price (mono, tabular) + change (green, mono) right; meta row (shares, yield) below a hairline divider.
- **Dividend "receipt" card (hero component)** — the one component that carries the brand. Left-aligned ticker mark + name, right-aligned mono amount, a 3px green accent bar on the left edge signaling "money received." Slide-up + fade entrance (`500ms cubic-bezier(.2,.8,.2,1)`, translateY 10px→0) plus a 600ms ease-out-cubic count-up animation on the amount whenever a new receipt appears. Fully respects `prefers-reduced-motion` (animation and count-up both disable, amount renders at final value instantly).
- **Badges/pills** — mono label, 12px/500, rounded-full, tinted background at 12% opacity of the semantic color (`--blue-info` / `--amber-warning`).

### States
Every data module needs explicit empty / loading / error treatments — do not let a table or card silently render blank:
- **Empty** — outline icon, one-line explanation, single primary CTA ("Add first holding").
- **Loading** — skeleton bars (`--bg-hover` fill, 12px height, rounded), no shimmer animation required but permitted if reduced-motion-safe.
- **Error** — amber-stroked icon (`--amber-warning`), one-line explanation of what failed and what's shown instead (e.g. cached values), single secondary "Retry" action.

### Charts
Green gradient fill (`--green-500` → transparent) for growth visuals. Grid lines at `--border-subtle` only — never a contrasting grid color. Data labels in mono with tabular figures. Loss bars/segments use the red equivalents, never green.

### Logo
**Supplied 2026-07-15** — see `assets/README.md` and `assets/logo.svg`. Prior to this date no mark existed and every layout reserved an empty, clearly labeled logo slot (dashed border, `LOGO` mono micro-label); that pattern is now superseded for new work — use the real mark, unresized and unrecolored, instead of the placeholder. `design-system.html` and `ui_kits/app/` still show the placeholder because they're preserved source evidence, not live product surfaces.

### Component interaction states

Every interactive component in the kit implements the same five states — use this as the checklist when adding a new one:

| Component | Default | Hover | Focus | Active/Pressed | Disabled |
|---|---|---|---|---|---|
| `.btn-primary` | `--green-500` fill, `--bg-base` text, CTA glow | fill → `--green-600` | `2px solid --green-500` outline, 2px offset | `translateY(1px)` | 40% opacity, no press transform |
| `.btn-secondary` | transparent, `--text-tertiary` outline | fill → `--bg-hover` | same focus ring | `translateY(1px)` | 40% opacity |
| `.btn-destructive` | transparent, `--red-500` outline | wash `rgba(248,113,113,.08)` | same focus ring | `translateY(1px)` | 40% opacity |
| `.icon-btn` | `--bg-surface`, `--text-tertiary` outline, `--text-secondary` stroke | fill → `--bg-hover` | same focus ring | `translateY(1px)` | n/a — icon buttons are not disabled in source evidence; if one must be, follow the button pattern |
| `.search-field` (applied kit) | `--bg-surface`, `--text-tertiary` outline | n/a | `:focus-within` border → `--green-500` | n/a | n/a |
| `.swatch` (docs only) | `--bg-surface`, `--border-subtle` | `translateY(-2px)`, border → `--text-tertiary` | `2px solid --green-500`, border → `--green-500` | n/a | n/a |

Every focus state uses the same `2px solid var(--role-focus-ring)` outline at `2px` offset — do not vary focus-ring color or width per component; consistency here is what makes keyboard navigation legible across the whole app.

## 7. Motion & Interaction

- **Entrance:** the receipt card is the only component with a designed entrance (slide-up + fade, 500ms, `cubic-bezier(.2,.8,.2,1)`). Do not add competing entrance animation to other components — restraint is the point.
- **Count-up:** numeric values that represent a "just happened" event (new dividend, new gain) count up over 600ms with `easeOutCubic`. Static/historical numbers render immediately — count-up is reserved for the moment of arrival, not every render.
- **Hover/press:** buttons and icon buttons use fast, subtle feedback — background shift on hover (`.08s`), 1px `translateY` on `:active`. No scale transforms on hover.
- **Focus:** every interactive element gets a visible `2px solid var(--green-500)` outline at `2px` offset on `:focus-visible`. Never remove focus rings.
- **Reduced motion:** every animation (`receiptIn`, count-up) has a `prefers-reduced-motion: reduce` fallback that renders the end state instantly. This is non-negotiable — the source evidence implements it consistently and any new motion must follow the same pattern.

## 8. Voice & Brand

- Tone: calm, precise, quietly confident — never hype-driven, never cutesy. No exclamation points, no "🎉 You earned...", no gamification language.
- Numbers do the talking. Copy explains what happened factually ("Twelve companies paid a dividend this quarter, three raised their payout for the fourth consecutive year") rather than editorializing.
- Timestamps and status are terse and factual: "Just now", "Updated 2 minutes ago", "Last update failed. Showing cached values."
- Empty/error states name the problem and the one available action — no filler apology copy.
- Financial figures always show their sign and currency (`+$46.20`) and use tabular alignment — never ambiguous unsigned numbers in a gains/loss context.

### Do / Don't (observed in source evidence)

| Moment | Do | Don't |
|---|---|---|
| Dividend arrives | "Coca-Cola Co. · Quarterly dividend · +$46.20" | "🎉 You just earned $46.20! Amazing!" |
| Empty holdings | "No holdings yet. Add a ticker to start tracking dividend income." | "Nothing here yet — let's get started on your journey!" |
| Price refresh fails | "Couldn't refresh prices. Last update failed. Showing cached values." | "Oops! Something went wrong 😅" |
| Trial ending | "Trial ends in 3 days" (amber badge) | "⏰ Don't miss out — upgrade now!!" |
| Loss figure | "−0.31%" in `--red-500`, signed and tabular | Unsigned "0.31%" with no color cue |

### Microcopy patterns to reuse

- **Status badges:** short, factual, mono label — "New feature", "Trial ends in 3 days" — never a call-to-action crammed into a badge.
- **Meta rows:** `label value` pairs separated by `·`, e.g. "12 holdings · Est. annual income $742.16 · Updated 2 minutes ago" — no filler connective words.
- **Button labels:** verb + object, two to three words — "Add holding", "View details", "Remove position" — never bare "OK"/"Submit" or over-long sentences.
- **Aria-labels on icon-only controls:** name the destination/action, not the icon shape — `aria-label="Dividend alerts"`, not `aria-label="Bell icon"`.

## 10. Light/Dark Mode Policy

**DivPulse ships dark-only, by deliberate brand decision — not an oversight.** `brand-spec.md`'s positioning statement is explicit: dark canvas signals "serious tool," and every layered-lightness elevation rule (§6) depends on a dark base. No light-mode tokens, markup, or `prefers-color-scheme` handling exist anywhere in source evidence, and none should be invented speculatively.

If a light mode is ever requested, treat it as a new brand decision requiring the same evidence-gathering rigor as this package — not a mechanical token inversion. Do not ship one without that step. For reference, here is what would and wouldn't change:

- **Would stay identical across modes:** `--green-500` (gain/CTA) and `--red-500` (loss) — these are semantic, not surface-dependent, and DivPulse's brand identity rests on this specific green.
- **Would need light counterparts:** every `--bg-*` and `--text-*` token (background/text inverts), plus the elevation model itself — layered lightness works because dark surfaces can only get *lighter*; a light mode would need a different depth cue (e.g. shadows, which source evidence explicitly avoids on dark).
- **Would need re-verification, not reuse:** the `--text-tertiary` AA failure is specific to these dark hex values at these sizes — a light-mode neutral scale would need its own contrast audit, not an assumption that the same 4.1:1 gap applies.

Until that work happens, `prefers-color-scheme: light` should be left unhandled (the app stays dark regardless of OS setting) rather than papered over with a partial/unverified light palette.

## 11. Implementation Notes

Reusable notes for anyone integrating this kit into a real codebase, distilled from how `kit/` already behaves:

- **Import order:** `colors_and_type.css` (or `kit/tokens.css` for the full set including spacing) → `kit/components.css` → `kit/interactions.js`. Component classes assume the custom properties already exist; loading order matters because CSS custom properties resolve at used-value time, not parse time, but undefined vars silently fall back to nothing.
- **Two-tier tokens:** use `--role-*` (semantic) in new code, reach for raw `--green-500`-style tokens only when extending `kit/components.css` itself to keep it consistent with its existing style. See §2 "Token roles."
- **JS is multi-instance safe:** `kit/interactions.js` scans for every `[data-receipt]` on the page and wires each independently (`DivPulseKit.initReceipts(root)`), so multiple receipt cards on one screen (see `ui_kits/app/alerts.html`) don't collide. Call `DivPulseKit.playReceiptEntrance(el)` directly when a new dividend notification is pushed into the DOM after page load, rather than re-running `initReceipts` on the whole document.
- **Reduced motion is load-bearing, not optional:** both the receipt entrance and the count-up check `window.matchMedia('(prefers-reduced-motion: reduce)')` and render the end state instantly when true. Any new animated component must follow the same guard — see `kit/interactions.js` for the exact pattern to copy.
- **Font loading:** `@import` in `colors_and_type.css`/`kit/tokens.css` is a Google Fonts CDN reference, not self-hosted — it blocks render until fetched. For production, replace with `<link rel="preload" as="font">` + self-hosted `.woff2` files and keep the same `--font-*` variable names so no component CSS needs to change.
- **Extending components:** add a new component class in a way that only reads `--role-*` / raw tokens and reuses `--radius-control` / `--radius-card` and the `--sp-*` scale — never hardcode a new pixel or hex value. If a genuinely new color is needed, it does not exist in this brand yet; stop and treat it as a brand-spec update, not a CSS-only addition.
- **Browser support:** `backdrop-filter` (topbar blur) and `font-variant-numeric: tabular-nums` are both widely supported in evergreen browsers but have no graceful fallback implemented in source evidence — verify against your actual support matrix before shipping if you target older browsers.

## 12. Anti-patterns

Do not do the following when generating with this system:

- Do not use white text on `--green-500` for primary buttons — this system deliberately uses dark (`--bg-base`) text on green.
- Do not fill destructive buttons solid red — destructive is outline-only; solid red is reserved for loss data.
- Do not use `--text-tertiary` for any text a user needs to reliably read (timestamps, captions, table headers, labels) — it fails WCAG AA. Use `--text-secondary`.
- Do not add drop shadows to convey elevation on dark surfaces — they're invisible here. Use layered lightness (base → surface → elevated) plus a 1px `--border-subtle` edge instead.
- Do not add text labels to icon buttons, and do not remove the label entirely on small screens — reposition it above the icon.
- Do not use green as generic decoration (backgrounds, dividers, illustrative flourishes) — it must always signal something (gains, primary action, active state).
- Do not invent a logo mark — the brand has not supplied one. Use the reserved, labeled empty slot.
- Do not skip empty/loading/error states on any data-bearing module.
- Do not add entrance/count-up animation to components other than the dividend receipt — one decisive flourish, not three competing ones.
- Do not ignore `prefers-reduced-motion` on any new animation.
- Do not introduce colors, radii, or spacing values outside the documented tokens in `colors_and_type.css` / `kit/tokens.css`.
- Do not default to warm beige/peach/cream backgrounds — this is a dark-canvas system by design.
- Do not ship a light theme by mechanically inverting tokens — `--green-500` (gain/CTA) and `--red-500` (loss) stay fixed across any future mode, and a light neutral scale needs its own contrast audit, not a copy of the dark one. See §10.
- Do not use `--border-subtle` as the sole boundary indicator on an interactive control (buttons, inputs, icon buttons) — it measures ~1.1–1.4:1 against every background, failing WCAG 1.4.11's 3:1 floor. Use `--text-tertiary` / `--role-border-interactive` instead. `--border-subtle` remains correct for structural dividers (card edges, table rows).
- Do not set `outline: none` (or otherwise suppress focus indication) on a form control without adding a replacement focus style — every focusable element needs a visible `:focus-visible`/`:focus-within` treatment, no exceptions.
