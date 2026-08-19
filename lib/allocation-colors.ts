/**
 * Segment palette shared by the allocation donut and the server-rendered
 * allocation tables/bars beside it, so a category is never drawn in two
 * different colours on the same screen.
 *
 * Deliberately a plain module with no "use client" boundary. This used to
 * live in components/dashboard/allocation-donut.tsx, which is a client
 * component — and app/(dashboard)/diversification/page.tsx is a Server
 * Component. A server module importing a *non-component value* from a
 * client module gets a client reference rather than the real value, so
 * `ALLOC_COLORS.length` read as undefined, `i % undefined` produced NaN,
 * and every `ALLOC_COLORS[NaN]` came back undefined. The bars and legend
 * dots rendered with no colour at all while the donut (which colours
 * itself client-side) looked fine. Same failure the TIPS object hit before
 * it was moved to lib/tips.ts — keep values like this out of client files.
 */
export const ALLOC_COLORS = ["#4c82f7", "#3fbf87", "#e0a45c", "#8b7fe8", "#5fb2c9", "#d8695f"] as const;
