/**
 * Curated ETF lists for the ETF Explorer feature.
 *
 * Tickers were chosen for dividend relevance, AUM size, and liquidity.
 * These lists are static — they are not pulled from a database so there
 * is no admin overhead, and the Yahoo Finance layer enriches them with
 * live prices/yields at render time.
 */

export type CuratedList = {
  id: string;
  title: string;
  description: string;
  tickers: string[];
};

export const CURATED_LISTS: CuratedList[] = [
  {
    id: "monthly-dividend-etfs",
    title: "Top Monthly Dividend ETFs",
    description: "ETFs that pay dividends every month — ideal for generating consistent monthly cash flow.",
    tickers: ["JEPI", "JEPQ", "QYLD", "RYLD", "XYLD", "DIVO", "NUSI", "SDIV", "SPHD", "PFFD"],
  },
  {
    id: "quarterly-dividend-etfs",
    title: "Top Quarterly Dividend ETFs",
    description: "High-yielding ETFs with quarterly distributions and strong track records.",
    tickers: ["SCHD", "VYM", "HDV", "DVY", "DGRO", "VIG", "NOBL", "SDY", "FVD", "SPYD"],
  },
  {
    id: "monthly-reits",
    title: "Top Monthly Dividend REITs",
    description: "Real Estate Investment Trusts that pay monthly dividends, combining real estate exposure with income.",
    tickers: ["O", "STAG", "MAIN", "GOOD", "AGNC", "NNN", "ADC", "IIPR", "LTC", "EPRT"],
  },
  {
    id: "weekly-dividend-etfs",
    title: "Top Weekly Dividend ETFs",
    description: "Option-income ETFs that distribute dividends every week — the highest-frequency income available.",
    tickers: ["QDTE", "XDTE", "RDTE", "CONY", "MSFO", "AMZY", "NVDY", "GOOGY", "TSLY", "YMAX"],
  },
];

export function getCuratedListById(id: string): CuratedList | undefined {
  return CURATED_LISTS.find((l) => l.id === id);
}
