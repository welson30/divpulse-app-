# DivPulse — Applied UI kit

Real DivPulse product screens, composed entirely from `../../colors_and_type.css` + `../../kit/tokens.css` + `../../kit/components.css` + `../../kit/interactions.js`. This is the system in use, not a generic static mock — every class here is the same class documented in `../../preview/components-buttons.html`.

## Source basis

Every screen composes only from tokens and component classes already defined in the preserved `kit/` package (see `../../context/provenance.md`). No new component was invented for this kit — `app.css` adds page-level shell/layout rules only (sidebar rail, page header, grids, table, search field, filter tabs), never a redefinition of a token or a `kit/components.css` class.

## Structure

```
ui_kits/app/
  index.html      Dashboard screen
  holdings.html   Holdings screen
  alerts.html     Dividend alerts screen
  app.css         shared page-level shell (sidebar, header, grids) — not components
  README.md       this file
```

## Component files / screens

| File | Screen | Key modules | Notable behavior |
|---|---|---|---|
| `index.html` | **Dashboard** | Portfolio summary (display figure + change badge), dividend calendar chart, diversification chart, recent-dividends receipt feed, top-holdings preview | Receipt entrance + count-up on the first "just now" payment (`kit/interactions.js`); embedded `@media print` rule hides chrome for a clean print view |
| `holdings.html` | **Holdings** | Full holdings table (ticker, company, shares, price, change, yield) with a search field | Live JS filter over ticker/company text; real empty-state message when a query matches nothing |
| `alerts.html` | **Dividend alerts** | Full dividend payment feed as stacked receipt cards | All / Unread filter tabs (`aria-pressed`, real click handler); empty-state message when Unread has nothing to show |

## Usage workflow

1. **Reviewing:** open `index.html` directly, or via `../../preview/applied-ui.html` which embeds all three screens live.
2. **Extending with a new screen:** copy an existing file's `<aside class="app-sidebar">` block verbatim (update which nav item carries `is-active`), then build the `<main class="app-main">` content from `../../kit/components.css` classes. Add new page-composition rules to `app.css` only if the layout genuinely needs a new shell pattern — never duplicate a component class that `kit/components.css` already defines.
3. **Wiring real data:** every `[data-value]` amount, holdings row, and receipt card here is static markup standing in for what a live app would render server-side or via JS. Swap the static rows for your data-fetching logic; keep the same class names so the design system's rules keep applying automatically.

## Design notes

- The left rail is icon-only navigation (per the standing icon-only-button preference in `../../DESIGN.md` §6); at ≤760px it becomes a bottom bar and labels reposition above each icon via `.icon-btn-label` (already defined in `kit/components.css`), rather than being removed.
- Every screen loads `colors_and_type.css` in addition to `kit/tokens.css` so the applied kit demonstrably uses the extracted, package-level token distributable — not only the original preserved kit.
- Financial figures use `font-variant-numeric: tabular-nums` throughout (holdings table, receipt amounts) so columns align — see `../../DESIGN.md` §3.
- Every screen uses the reserved empty logo slot (`.app-logo-slot`, a scaled-down version of `design-system.html`'s `.logo-slot`) — no mark has been supplied in source evidence. See `../../assets/README.md`.
- `app.css` intentionally sticks to raw tokens (matching `kit/components.css`'s existing style); if you add new page-composition rules here, prefer the `--role-*` semantic tokens from `colors_and_type.css` (`--role-bg-canvas`, `--role-border`, …) documented in `../../DESIGN.md` §2 — they read as intent and keep new shell code consistent with future re-theming.
- No `prefers-color-scheme: light` handling anywhere in this kit, by design — see `../../DESIGN.md` §10 before adding any.

## Reuse elsewhere

To bring this applied shell into a different DivPulse surface, copy `app.css` alongside the three token/component stylesheets and reuse the `.app-shell` / `.app-sidebar` / `.app-main` / `.page-header` classes — they are page-composition helpers designed to be shared across any new DivPulse screen, not screen-specific one-offs.

### Porting to a component framework (optional)

This kit ships as plain HTML/CSS/JS with no separate `components/` folder — every screen composes classes directly from `kit/components.css`. If a team ports it into React/Vue/etc., the class boundaries already suggest a natural split: `components/AppSidebar.jsx` (the `.app-sidebar` nav rail), `components/HoldingCard.jsx` (`.holding-card`), `components/DividendReceipt.jsx` (`.receipt` + `interactions.js`), and `components/StateCard.jsx` (`.state-card` empty/loading/error). Keep the underlying class names unchanged so `kit/components.css` still applies without modification.
