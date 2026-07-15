const rows = [
  { ticker: "KO", company: "The Coca-Cola Company", shares: 240, price: "64.28", change: "+0.42%", positive: true, yield: "3.1%" },
  { ticker: "JNJ", company: "Johnson & Johnson", shares: 85, price: "152.90", change: "+0.18%", positive: true, yield: "3.4%" },
  { ticker: "PG", company: "Procter & Gamble", shares: 64, price: "158.12", change: "−0.09%", positive: false, yield: "2.4%" },
  { ticker: "VZ", company: "Verizon Communications", shares: 310, price: "40.55", change: "−0.31%", positive: false, yield: "6.6%" },
  { ticker: "O", company: "Realty Income Corp", shares: 150, price: "54.90", change: "+0.27%", positive: true, yield: "5.6%" },
] as const;

/** Ported from Design-System/ui_kits/app/holdings.html's table markup and real sample rows. */
export function HoldingsPreviewTable() {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-subtle bg-surface">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Ticker</th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-left font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Company</th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Shares</th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Price</th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Change</th>
            <th className="border-b border-border-subtle px-sp-3 py-3.5 text-right font-mono text-xs font-medium tracking-[0.06em] text-text-secondary uppercase">Yield</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.ticker} className={i === rows.length - 1 ? "" : "border-b border-border-subtle"}>
              <td className="px-sp-3 py-3.5 font-mono text-sm font-semibold text-text-primary">{row.ticker}</td>
              <td className="px-sp-3 py-3.5 text-[13px] text-text-secondary">{row.company}</td>
              <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">{row.shares}</td>
              <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">{row.price}</td>
              <td className={`px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums ${row.positive ? "text-green-500" : "text-red-500"}`}>{row.change}</td>
              <td className="px-sp-3 py-3.5 text-right font-mono text-sm tabular-nums text-text-primary">{row.yield}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
