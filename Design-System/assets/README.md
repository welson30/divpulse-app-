# Assets

## Logo — supplied 2026-07-15

`brand-spec.md`'s original instruction — "Not supplied. Every layout reserves an empty, clearly labelled logo slot until one is provided — do not invent a mark" — held until a real mark was supplied. A mark now exists:

- `assets/logo.svg` — canonical vector source (1254×1254 viewBox), green (`--green-500`-family) bar-chart-and-trend-arrow mark on a near-black (`#040706`) square, matching `--bg-base`.
- `assets/logo.png` — 1254×1254 raster export of the same mark.

Use `logo.svg` wherever the mark appears in product UI. Do not resize, recolor, or reinterpret it — swap the reserved `.logo-slot` markup below for an `<img>`/inline `<svg>` referencing this file as-is.

The full favicon/app-icon/PWA-manifest set generated from this source lives in the Next.js app, not here (see `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/manifest.ts`, `public/icons/manifest-*.png`, regenerated via `scripts/generate-icons.mjs`) — this folder holds the canonical source files only.

### The reserved slot pattern (historical — superseded)

Every surface that would normally show a logo previously rendered a labeled placeholder, matching `design-system.html`'s `.logo-slot`:

```html
<div class="logo-slot" aria-label="Logo placeholder">
  <span>LOGO</span>
</div>
```

```css
.logo-slot {
  width: 96px; height: 96px; border-radius: 16px;
  border: 1.5px dashed var(--border-subtle);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logo-slot span {
  font: 600 10px/1 var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-secondary);
}
```

`design-system.html` and `ui_kits/app/` (the preserved source evidence) still show the dashed placeholder — that's expected, they document the state as originally captured. New product surfaces should use the real mark instead.

## Other imagery

No photography, illustration, or app-icon assets were present in source evidence either. DivPulse's visual system is intentionally token- and typography-driven (see `DESIGN.md` §1) rather than imagery-driven, so this is not expected to be a gap for most surfaces — icons live in `build/icons/` instead.
