# Assets

## Logo — not supplied

`brand-spec.md` states this explicitly:

> Not supplied. Every layout reserves an empty, clearly labelled logo slot until one is provided — do not invent a mark.

No logo file, wordmark, favicon, app icon, or brand imagery exists anywhere in the source evidence for this project. Nothing has been fabricated to fill this gap — see `context/provenance.md` for the full blocker note.

### The reserved slot pattern

Every surface that would normally show a logo instead renders a labeled placeholder, matching `design-system.html`'s `.logo-slot`:

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

This pattern is already implemented in `design-system.html` (cover header + footer) and reused in `ui_kits/app/`. When a real logo file is supplied, drop it into this folder (e.g. `assets/logo.svg`, `assets/wordmark.svg`) and swap the `.logo-slot` markup for an `<img>`/inline `<svg>` — do not resize or reinterpret the mark once supplied.

## Other imagery

No photography, illustration, or app-icon assets were present in source evidence either. DivPulse's visual system is intentionally token- and typography-driven (see `DESIGN.md` §1) rather than imagery-driven, so this is not expected to be a gap for most surfaces — icons live in `build/icons/` instead.
