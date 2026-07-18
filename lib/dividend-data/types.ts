export type DividendEvent = {
  ticker: string;
  exDate: string | null;
  payDate: string;
  amountPerShare: number;
};

/**
 * The interface every dividend data provider implements. Isolated so the
 * unofficial Yahoo Finance provider (lib/dividend-data/yahoo-finance.ts)
 * can be swapped for a paid, SLA-backed provider later without touching
 * the detection job — see ARCHITECTURE.md §12's Yahoo Finance risk note.
 */
export interface DividendDataProvider {
  fetchDividends(ticker: string): Promise<DividendEvent[]>;
}
