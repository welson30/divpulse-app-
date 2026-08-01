const WIDTH = 800;
const HEIGHT = 160;
const POINT_COUNT = 70;

/** Deterministic pseudo-random in [0, 1) — same output every render/build, no hydration mismatch risk from Math.random(). */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Jagged zigzag, not a smooth curve — straight segments between many
// close points read as an actual price series; a couple of cubic-bezier
// humps read as decoration. Slight upward drift left-to-right (lower y =
// higher on screen) with noise on top, hand-tuned to match the client's
// reference image rather than computed from real data — purely a design
// texture, by the client's own call. The <svg> itself is only `w-1/2`
// (right-anchored) — preserveAspectRatio="none" stretches this whole
// WIDTH-wide pattern to fit that half-width box, so all 36 points still
// show, just horizontally compressed, not cropped.
const POINTS = Array.from({ length: POINT_COUNT }, (_, i) => {
  const t = i / (POINT_COUNT - 1);
  const x = t * WIDTH;
  // t**1.7 (rather than a flat t) keeps the drift gentle across the
  // first half and steepens it toward the right end, instead of a
  // uniform diagonal the whole way across.
  const trend = 100 - Math.pow(t, 1.7) * 74;
  const noise = (seededRandom(i) - 0.5) * 64;
  const y = Math.min(146, Math.max(10, trend + noise));
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

/**
 * Purely decorative wave behind the dashboard's greeting header — ambient
 * design texture, not a data visualization (no axis, no labels,
 * aria-hidden, not tied to the user's actual portfolio numbers — the
 * client explicitly wants this as pure design, not real data).
 *
 * Rendered first in DOM order with no z-index of its own; the caller
 * wraps the heading/date/badge content in a `relative z-10` layer so it
 * paints on top through normal stacking order. A negative z-index here
 * was tried first and was unreliable — with no stacking context of its
 * own on the sibling text, `-z-10` could end up compositing behind the
 * page background instead of just behind the text, making the whole
 * backdrop invisible.
 */
export function GreetingBackdrop() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-0 right-0 h-35 w-1/2 sm:h-40"
    >
      <defs>
        <linearGradient id="greeting-backdrop-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green-500)" stopOpacity="0.14" />
          <stop offset="35%" stopColor="var(--green-500)" stopOpacity="0" />
        </linearGradient>
        {/* Soft fade on the box's own left edge, so cutting the graph off
            at the halfway point reads as an intentional vignette rather
            than a hard, visible seam. */}
        <linearGradient id="greeting-backdrop-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="greeting-backdrop-mask">
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#greeting-backdrop-fade)" />
        </mask>
      </defs>
      <g mask="url(#greeting-backdrop-mask)">
        <polygon points={`0,${HEIGHT} ${POINTS} ${WIDTH},${HEIGHT}`} fill="url(#greeting-backdrop-fill)" />
        <polyline points={POINTS} fill="none" stroke="var(--green-500)" strokeOpacity="0.3" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
