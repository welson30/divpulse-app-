/**
 * Figma Homepage — phone composition node 1:26
 * Layout box: 551 × 691
 * Asset: 4× PNG with transparent canvas (tilt + floats baked in)
 */
export function HeroPhone() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 4x marketing asset; avoid next/image resampling
    <img
      className="pp-phone-img"
      src="/marketing/hero/phone-composition.png?v=10"
      alt="PaidPrime lock screen with dividend notifications and income cards"
      width={2486}
      height={2620}
      decoding="async"
      fetchPriority="high"
    />
  );
}
