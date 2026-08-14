/** Apple sign-in isn't implemented yet — rendered disabled rather than omitted, so the layout still reads as two OAuth options with one clearly not ready, instead of a broken-looking dead click. */
export function AppleSignInButton() {
  return (
    <button
      type="button"
      disabled
      title="Apple sign-in isn't available yet"
      className="relative flex h-[52px] w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-[14px] border border-[#2e343b] bg-[#16191d] text-[15px] leading-[25px] font-medium text-[#6c737f] opacity-60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marketing/signin/icon-apple.svg" alt="" width={18} height={18} className="size-[18px] opacity-70" />
      Apple
      <span className="absolute -top-2 right-2 rounded-full border border-[#2e343b] bg-[#0b0c0e] px-1.5 py-[1px] text-[9px] font-semibold tracking-[0.6px] text-[#6c737f] uppercase">
        Soon
      </span>
    </button>
  );
}
