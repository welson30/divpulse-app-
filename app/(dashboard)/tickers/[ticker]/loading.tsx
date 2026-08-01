/**
 * Route-level skeleton — the ticker page's first load does 6 requests in
 * parallel (Yahoo quote + quoteSummary + price history, 3 Supabase
 * queries), so it's worth a shape-matching placeholder rather than a
 * blank frame. Mirrors the real layout's block sizes, not a generic spinner.
 */
export default function TickerDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-sp-4">
      <div className="flex flex-col gap-sp-3 rounded-card border border-border-subtle bg-surface p-sp-4">
        <div className="flex items-center gap-sp-2">
          <div className="size-16 shrink-0 rounded-[8px] bg-surface-2" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-20 rounded-[5px] bg-surface-2" />
            <div className="h-3.5 w-40 rounded-[5px] bg-surface-2" />
          </div>
        </div>
        <div className="h-8 w-32 rounded-[5px] bg-surface-2" />
      </div>

      <div className="grid grid-cols-1 gap-sp-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-sp-2 rounded-card border border-border-subtle bg-surface p-sp-3">
          <div className="h-7 w-64 rounded-full bg-surface-2" />
          <div className="h-[220px] w-full rounded-card bg-surface-2 sm:h-[320px] lg:h-[400px]" />
        </div>
        <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-2">
          <div className="h-20 rounded-card border border-border-subtle bg-surface-2" />
          <div className="h-20 rounded-card border border-border-subtle bg-surface-2" />
          <div className="h-20 rounded-card border border-border-subtle bg-surface-2" />
          <div className="h-20 rounded-card border border-border-subtle bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
