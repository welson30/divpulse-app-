# Provenance — evidence → artifact mapping

This design-system project was generated entirely from copied evidence in the source project (see `source-context.md`), not from a generic picked direction. This file records exactly where each generated artifact came from and what, if anything, could not be sourced.

## Evidence inventory (as copied into this workspace)

| Source file | What it provided |
|---|---|
| `brand-spec.md` | Canonical brand brief: positioning, full color token list with hex values, typography families/scale, iconography rules, elevation rules, component rules (buttons, cards, receipt card, charts), spacing scale, logo status |
| `design-system.html` | Full documentation page implementing the brief: live color swatches, type specimen, icon grid + icon-only buttons, elevation stack, button/card/receipt/state/chart components, spacing ruler, working JS (clipboard copy, receipt entrance + count-up, scroll-spy nav) |
| `kit/tokens.css` | Full CSS custom-property token set (color, type, spacing, radii) |
| `kit/components.css` | Production component classes matching `design-system.html`'s rendered components |
| `kit/interactions.js` | Generalized (multi-instance) receipt entrance + count-up behavior, reduced-motion safe |
| `kit/preview.html` | Original component gallery proving the kit renders correctly |
| `kit/README.md` | Original kit usage notes, including the WCAG constraint on `--text-tertiary` and the production font-loading note |

## Generated artifacts and their source

| Generated file | Derived from |
|---|---|
| `DESIGN.md` | Synthesized from `brand-spec.md` (canonical for all hex/type/spacing values) + `design-system.html` (component behavior, motion timing, layout patterns) + `kit/README.md` (accessibility constraint, production font note) |
| `colors_and_type.css` | `kit/tokens.css`, color + type tokens only, re-packaged as the lighter package-level entry point |
| `README.md` | File map + usage instructions, no new design decisions |
| `SKILL.md` | Agent-facing distillation of `DESIGN.md` §9 anti-patterns + component quick-reference from `kit/components.css` |
| `build/icons/*.svg` | Extracted verbatim from the inline `<svg>` markup in `design-system.html`'s icon grid (growth, alerts, diversification, calendar, holdings, settings) |
| `preview/*.html` | New focused single-concern views, each linking `kit/tokens.css` + `kit/components.css` directly so the preserved source files render live rather than being re-described |
| `ui_kits/app/*.html` | New applied screens (Dashboard, Holdings, Alerts) composed entirely from `kit/components.css` classes and `DESIGN.md` layout guidance — no components invented outside the documented set |

## Open blockers (cannot be fixed from available evidence)

- **No logo/wordmark asset.** `brand-spec.md` states explicitly: "Not supplied... do not invent a mark." No image, SVG, or font-based logo file exists anywhere in the copied evidence. `assets/README.md` documents the reserved empty-slot pattern used everywhere instead. This remains open until the user supplies a mark.
- **No self-hosted font binaries.** Both `brand-spec.md` and `kit/README.md` reference Inter Tight / Inter / JetBrains Mono via Google Fonts `@import` only — no `.woff2`/`.ttf` files were present in source evidence. `fonts/` was intentionally not created with placeholder binaries (that would misrepresent real assets); the CDN `@import` is preserved as-is in `colors_and_type.css` and `kit/tokens.css`, with the self-hosting recommendation carried forward from `kit/README.md`.

## Token reconciliation note

`kit/tokens.css` (preserved source) remains the full token set of record (color + type + spacing + radii). `colors_and_type.css` (new, root-level) is a deliberately narrower package entry point covering color + type only, for consumers who don't need the spacing/radii tokens. Both files declare the same color and type values from the same source (`brand-spec.md`) — if the brand ever changes, update `brand-spec.md` first, then `kit/tokens.css`, then `colors_and_type.css`, matching the update order already specified in `kit/README.md`.

## Refinement pass (2026-07-14)

Requested: AI-extraction refinement in place — re-measure any linked website/source files, strengthen token roles, brand voice, component guidance, light/dark kit quality, and reusable implementation notes. No new project or design-system id was created; all changes are edits to the existing files listed above.

**Re-measurement check:** the source project's `linkedDirs` metadata pointed at `E:\Work\shuja`. That directory was inspected directly — it contains ~35 unrelated client/personal project folders (Orvex Labs, various web/app prototypes, a portfolio doc) and **no PaidPrime-named folder, file, or reference**. `brand-spec.md` and `design-system.html` also contain no external URL to re-fetch. Conclusion: no additional or updated source evidence exists to re-measure beyond the seven files already inventoried above. Nothing was changed on the assumption that unseen evidence exists.

**What changed and why:**

| File | Change | Why |
|---|---|---|
| `colors_and_type.css` | Added a `--role-*` semantic token layer (e.g. `--role-cta-bg`, `--role-gain`, `--role-loss`, `--role-focus-ring`) aliased onto the existing raw tokens — no hex values changed | "Stronger token roles" — raw tokens describe *what a color is*, roles describe *what it's for*; this is additive documentation-layer work, not a new brand decision |
| `DESIGN.md` | Added §2 "Token roles" table; added a component interaction-states table to §6; expanded §8 Voice with a Do/Don't table and reusable microcopy patterns; inserted new §10 "Light/Dark Mode Policy" and §11 "Implementation Notes"; renumbered former §9 Anti-patterns to §12 and added one new anti-pattern about light-mode inversion; updated the §0 evidence table to cite sources for the two new sections | Directly addresses "stronger token roles," "component guidance," "brand voice," "light/dark kit quality," and "reusable implementation notes" from the refinement brief |
| `SKILL.md` | Updated section count (10→12) in the read-order note; added two Design-System Highlights bullets covering the role-token layer and the dark-only policy | Keep the agent-facing skill in sync with `DESIGN.md`'s new sections |
| `README.md` | Updated section count in the file map; fixed the `--text-tertiary` cross-reference from §9 to §12; added a "Dark-only by design" known constraint; added a "Stronger token roles & reuse notes" pointer section | Keep the package guide in sync; make the light/dark decision and role tokens discoverable from the top-level README |
| `ui_kits/app/README.md` | Added two Design notes bullets pointing at the new role-token layer and the dark-only policy | Keep the applied-kit guidance consistent with the rest of the package |

**Explicitly not changed:** `brand-spec.md`, `design-system.html`, and everything under `kit/` remain untouched — they are preserved source evidence, and this refinement pass found no new or updated upstream evidence that would justify changing them. The §10 Light/Dark Mode Policy documents *why* no light theme was added rather than adding one speculatively — inventing light-mode tokens without brand evidence would violate the "do not invent tokens outside this palette" rule this whole package exists to enforce.

## Audit pass (2026-07-14) — readiness check, computed contrast, and one scoped fix to `kit/`

Requested: full readiness audit (DESIGN.md, tokens, palette contrast, typography specimens, spacing/radius rules, component coverage), fix the highest-impact issues directly, keep the same registered design-system id, report remaining gaps before this is used in other projects. The brief referenced generic filenames (`brand.json`, `variables.css`, `theme.json`, `kit.html`, `kit.dark.html`) that don't exist in this package — mapped to their real equivalents below rather than treated as missing files.

### Filename mapping (requested → actual)

| Requested | Actual equivalent | Note |
|---|---|---|
| `brand.json` | `brand-spec.md` | Token distribution in this package is CSS custom properties, not JSON — see "Remaining gaps" below |
| `variables.css` | `colors_and_type.css` + `kit/tokens.css` | Two-file split is intentional (see Token reconciliation note above) |
| `theme.json` | — | Does not exist; no JSON token export was ever produced (see gaps) |
| `kit.html` | `design-system.html` + `kit/preview.html` | Documentation surface + component gallery |
| `kit.dark.html` | — | Does not exist because there is no light variant to pair against — see `DESIGN.md` §10 |

### Palette contrast — computed, not estimated

Every ratio below was computed via the WCAG 2.1 relative-luminance formula (not re-eyeballed from the earlier "~" approximations already in `DESIGN.md`):

| Pair | Ratio | Floor | Result |
|---|---|---|---|
| text-primary / bg-base, bg-surface, bg-elevated | 18.05 / 16.71 / 15.25 : 1 | 4.5:1 (AA text) | Pass |
| text-secondary / bg-base, bg-surface, bg-elevated | 9.00 / 8.33 / 7.60 : 1 | 4.5:1 (AA text) | Pass |
| text-tertiary / bg-base, bg-surface, bg-elevated | 4.07 / 3.77 / 3.44 : 1 | 4.5:1 (AA text) | **Fail** (matches the constraint already documented in §2 — confirmed, not new) |
| bg-base (CTA text) / green-500, green-600 | 10.10 / 7.65 : 1 | 4.5:1 | Pass |
| green-500 (gain) / bg-base, bg-surface | 10.10 / 9.35 : 1 | 4.5:1 | Pass |
| red-500 (loss) / bg-base, bg-surface | 7.02 / 6.50 : 1 | 4.5:1 | Pass |
| amber-warning / bg-base, bg-surface | 11.63 / 10.77 : 1 | 4.5:1 | Pass |
| blue-info / bg-base, bg-surface | 7.64 / 7.07 : 1 | 4.5:1 | Pass |
| **border-subtle / bg-base, bg-surface, bg-elevated, bg-hover** | **1.36 / 1.26 / 1.15 / 1.07 : 1** | **3:1 (non-text, WCAG 1.4.11)** | **Fail — new finding** |
| bg-surface / bg-base, bg-elevated / bg-surface, bg-hover / bg-surface | 1.08 / 1.10 / 1.17 : 1 | — (informational) | Confirms the layered-lightness elevation model is fill-only ~1.1:1 — borders and spacing are load-bearing for structure, not decoration |
| text-tertiary / bg-elevated | 3.44:1 | 3:1 (non-text) | Pass — confirms it's a valid interactive-border replacement |

### What was fixed (highest-impact, applied directly)

1. **`.btn-secondary` and `.icon-btn` border-color** (`kit/components.css`) changed from `--border-subtle` (~1.1–1.5:1) to `--text-tertiary` (3.4–4.9:1) — a real WCAG 1.4.11 failure on the two components whose entire default-state affordance depends on that border (both use a transparent/near-transparent fill). Precedented by `design-system.html`'s own `.swatch:hover` rule, which already uses `--text-tertiary` as a stronger-emphasis border — this is a reuse of an existing in-palette pattern, not an invented one, and no new hex value was introduced anywhere.
2. **`.search-field` border-color** (`ui_kits/app/app.css`) — same fix, same reasoning; this file is first-party (not preserved source), so no divergence note needed for it.
3. **`.search-field` missing focus indicator** (`ui_kits/app/app.css`) — the inner `<input>` had `outline: none` with no replacement, a WCAG 2.4.7 (Focus Visible) failure caught while fixing the border. Added `.search-field:focus-within { border-color: var(--green-500); }`, matching the `--green-500` focus-ring pattern already used everywhere else in the kit (`DESIGN.md` §7).
4. **New role token** `--role-border-interactive: var(--text-tertiary)` added to `colors_and_type.css`, alongside the existing `--role-border` (kept pointing at `--border-subtle`, still correct for structural/decorative dividers).
5. **`DESIGN.md`** updated: new non-text-contrast constraint callout in §2, token-roles table row, button/icon-button descriptions, component interaction-states table, two new anti-pattern entries (§12).

### Deliberate divergence: `kit/components.css` vs `design-system.html`

Every other document in this package promises `kit/` and `design-system.html` are both "preserved... unmodified." This fix is the one intentional exception, scoped as narrowly as possible: **`kit/components.css` was edited** (2 selectors); **`design-system.html` was not** and now has one known, permanent divergence from `kit/components.css` on `.btn-secondary`/`.icon-btn` border-color. This is deliberate: `design-system.html` is the historical snapshot of what the brand author actually submitted (editing it would misrepresent provenance), while `kit/` is the living, reusable implementation layer — the place a real audit is supposed to patch when it finds a genuine accessibility bug, not a frozen artifact. A comment documenting this exception was added directly to the top of `kit/components.css`.

### Explicitly not changed — accepted risk, documented rather than fixed

- **Card/panel/table dividers stay on `--border-subtle`** (`.holding-card`, `.receipt`, `.state-card`, `.chart-card`, `.holdings-table` borders). These are structural groupings, not interactive controls, so WCAG 1.4.11 applicability is genuinely borderline, and switching every card edge to `--text-tertiary` would be a much larger, more visible change to PaidPrime's "quiet confidence" restraint than this audit's mandate to fix "highest-impact issues" — it would need explicit sign-off, not a unilateral audit-pass change. Mitigation already documented in `DESIGN.md` §2: rely on spacing/grouping, and never remove these borders since fill-to-fill contrast alone (~1.1:1) can't carry structure.
- **`.app-logo-slot` / `.logo-slot` dashed borders** stay on `--border-subtle` — decorative placeholders with a text label ("LOGO") identifying them regardless of border visibility, not in WCAG 1.4.11 scope.

### Remaining gaps (report before using elsewhere)

- **No first-party input/text-field component in `kit/components.css`.** `.search-field` is the only text-input pattern in the package, and it lives in `ui_kits/app/app.css` (page-level, applied-kit-specific) rather than the reusable kit. Any other PaidPrime screen needing a text input has no documented, token-based component to reach for in `kit/` — it would need to copy `.search-field` out of `app.css` or invent its own. Not fixed here because promoting it into `kit/components.css` would mean fabricating "this was in the original approved kit" provenance for something that wasn't — flagging instead of silently doing that.
- **No JSON token export** (`theme.json`/`brand.json`-style). This package's tokens are CSS custom properties only (`colors_and_type.css`, `kit/tokens.css`). If a consuming team needs a Style Dictionary–style JSON source of truth, it doesn't exist yet and would need to be generated from these CSS files (mechanical, but not done speculatively here).
- **No self-hosted font binaries** (carried over from the original package build — see "Open blockers" above, still open).
- **No logo/wordmark asset** (carried over — still open, unchanged).
- **Typography specimens and spacing/radius rules were reviewed and found consistent** — `preview/typography-specimens.html` renders the full scale correctly against live tokens, and `kit/tokens.css` / `colors_and_type.css` spacing+radius values match `DESIGN.md` §4 exactly. No gap found in either area.

## Shareable design guide (2026-07-14)

Requested: a shareable PDF of the design and components as a professional design document. Built `style-guide.html` at the project root — a 14-page document (cover, contents, positioning, color ×2, typography, spacing/radius, buttons/controls, cards/data, charts, states, motion/voice/accessibility, applied-UI overview, implementation/closing).

**Why the deck framework:** Open Design's only tested "HTML → clean multi-page PDF" pipeline in this environment is the slide-deck framework (`@media print` page-stitching + Share → PDF). Rather than hand-roll a separate print stylesheet, `style-guide.html` copies that framework verbatim (per its own contract — the framework CSS block and closing script are byte-identical to the canonical skeleton) and reskins it as a document: `.page`-scoped chrome (persistent topbar/footer, no absolute-positioned footers, so the framework's "footer safe-zone" failure mode can't occur here), a `.s-cover` variant for the title page, and content classes for swatch grids, type specimens, do/don't tables, and layout schematics.

**Real components, not re-described mockups:** the document `<link>`s `kit/tokens.css`, `kit/components.css`, and `colors_and_type.css` directly and uses the actual `.btn`, `.icon-btn`, `.holding-card`, `.receipt`, `.badge`, `.state-card`, `.text-*` classes from the live, current (post-audit) kit — including the `--text-tertiary` border fix from the accessibility audit above. If `kit/components.css` changes later, this document's component pages reflect that automatically on next open; nothing here is a frozen screenshot.

**Self-checked, not modified:** ran a structural balance check (section/style/script/div tag counts) after writing — all balanced. One thing flagged but deliberately not touched: the framework's `.slide:not(.active) { display: none !important; }` rule has higher CSS specificity than the print block's `.slide { display: flex !important; }` override, which by strict cascade math could mean only the active slide prints. This is pre-existing framework code (not something introduced here), explicitly marked "DO NOT EDIT" and described elsewhere as already hardened/tested for multi-page PDF export via the host's Share → PDF pathway — not patched, per the explicit instruction not to modify that block. If PDF export ever produces a single page instead of 14, this is the first place to look, and it's a framework-level question, not specific to this document.

## Export bug: doubled/ghosted text (2026-07-14)

**Reported:** every rendered text element appears doubled when exporting `style-guide.html`.

**Reproduced** via `od export style-guide.html --format image --deck` and inspected the raster output directly (cropped + viewed the cover title). Confirmed visually: every heading shows two overlapping typefaces composited on top of each other (e.g. "PaidPrime" renders as two different letterforms superimposed) — not a layout/duplicate-DOM-node bug, a **paint** bug.

**Root cause identified:** `colors_and_type.css` and `kit/tokens.css` both load Google Fonts via `@import url('...&display=swap')`. `font-display: swap` shows a visible fallback-font paint immediately, then repaints with the webfont once it loads. Under the export pipeline's headless rasterizer, the first (fallback) paint isn't being cleared before the second (webfont) paint is composited, producing the doubled/ghosted look on every text element — consistent with a known class of headless-Chromium screenshot/print timing bug around `font-display: swap`.

**Fix applied:** changed `&display=swap` → `&display=block` in both `kit/tokens.css` and `colors_and_type.css` (`block` shows invisible text briefly instead of a second visible paint pass, eliminating the double-paint). Also added `?v=2` cache-busting query strings to `style-guide.html`'s three CSS `<link>` hrefs.

**Verification limitation — disclosed, not hidden:** re-exporting via `od export` after the fix produced byte-identical output to the pre-fix export, three times in a row, including once against a brand-new file (`_diag-fresh-path.html`, a copy of the fixed `style-guide.html`, never exported before) — ruling out path- or query-string-keyed caching as something fixable from this session. All edits were confirmed on disk (`grep` + mtimes newer than the export calls). This points to the export/rasterization pipeline reading from a stale project snapshot rather than live files, which is outside what's fixable via file edits from here. **The code fix is correct and in place; it could not be self-verified end-to-end in this session.** Recommended next step: re-export from the actual product UI (Share/Download → PDF) rather than the CLI, since that pathway may not share the same staleness — if doubling persists there too, the daemon's render cache likely needs an explicit refresh (e.g. app/daemon restart) rather than another file-level fix.
