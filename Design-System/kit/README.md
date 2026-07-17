# PaidPrime System Kit

The reusable, implementation-ready package derived from `/design-system.html` and `/brand-spec.md`. This folder is what a developer imports — the root files remain the reference documentation and philosophy.

## Files

| File | Purpose |
|---|---|
| `tokens.css` | CSS custom properties only: color, type, spacing, radii. Import first. |
| `components.css` | Real product component classes (buttons, icon buttons, badges, holding card, dividend receipt, empty/loading/error states, type utilities). Requires `tokens.css`. |
| `interactions.js` | Vanilla JS behavior for the dividend receipt: entrance animation + amount count-up, reduced-motion safe, supports multiple instances per page. |
| `preview.html` | Live component gallery rendered from the three files above — open it to sanity-check the kit renders correctly before wiring it into the app. |

## Usage

```html
<link rel="stylesheet" href="kit/tokens.css">
<link rel="stylesheet" href="kit/components.css">
...
<script src="kit/interactions.js"></script>
```

### Dividend receipt (auto-initializing)

Mark the card with `data-receipt` and give the amount element `data-value` (a plain number, no `$`/`+`). Add `data-receipt-replay` to any button to let it re-trigger the entrance + count-up:

```html
<div class="receipt" data-receipt>
  <div class="left">
    <div class="mark">KO</div>
    <div class="ticker-name"><b>Coca-Cola Co.</b><span>Quarterly dividend</span></div>
  </div>
  <div class="right">
    <div class="amount" data-value="46.20">+$46.20</div>
    <div class="when">Just now</div>
  </div>
</div>
<button data-receipt-replay>Replay</button>
```

Every `[data-receipt]` on the page plays its entrance once on load (e.g. when a new dividend notification is pushed into the DOM, call `PaidPrimeKit.playReceiptEntrance(el)` directly rather than waiting for the page-load pass).

## Not included here (documentation-only, stays in `/design-system.html`)

Color swatches, the type specimen table, the icon-style demonstration grid, the elevation layering diagram, and the spacing ruler are all explanatory — they don't belong in a component kit a developer imports into the running app. If the palette or scale ever changes, update `/brand-spec.md` first, then `tokens.css` here, then the swatches in `/design-system.html` — in that order.

## Known constraint

`--text-tertiary` (#6B7570) fails WCAG AA (~4.1:1) at small sizes on these backgrounds. It's included in `tokens.css` for completeness but no component in `components.css` uses it for legible text — only `--text-secondary` (~9:1). Keep it that way unless the token itself changes.

## Production note

`tokens.css` loads Inter Tight / Inter / JetBrains Mono from Google Fonts via `@import` for parity with the documentation. For production, self-host these (or use `<link rel="preload">` + `font-display: swap`) rather than relying on the CSS `@import`, which blocks render until fetched.
