/**
 * Curated ETF lists for the ETF Explorer feature.
 *
 * Tickers were chosen for dividend relevance, AUM size, and liquidity.
 * These lists are static — they are not pulled from a database so there
 * is no admin overhead, and the Yahoo Finance layer enriches them with
 * live prices/yields at render time.
 */

export type PayFrequency = "Monthly" | "Quarterly" | "Weekly";

export type CuratedList = {
  id: string;
  title: string;
  description: string;
  frequency: PayFrequency;
  tickers: string[];
  /** If true, this list focuses on growth/appreciation rather than income */
  isGrowth?: boolean;
};

export const CURATED_LISTS: CuratedList[] = [
  {
    id: "growth-core-etfs",
    title: "Growth & Core Portfolio",
    description: "The foundation of a long-term portfolio — S&P 500, Nasdaq, and total-market ETFs for compounding wealth over time. Start here before chasing yield.",
    frequency: "Quarterly",
    isGrowth: true,
    tickers: [
      // Core index — the backbone
      "VOO", "QQQM", "VTI", "QQQ", "SPY",
      // Growth-tilted
      "MGK", "VONG", "IWF", "SCHG", "VUG",
      // Dividend-growth hybrid (income + appreciation)
      "SCHD", "VYM", "DGRO", "VIG", "NOBL",
      // International diversification
      "VXUS", "VEA", "EFA", "VWO", "IXUS",
      // Bonds for balance
      "BND", "AGG", "BIL", "SGOV", "SCHZ",
    ],
  },
  {
    id: "monthly-dividend-etfs",
    title: "Top Monthly Dividend ETFs",
    description: "ETFs that pay dividends every month — ideal for generating consistent monthly cash flow.",
    frequency: "Monthly",
    tickers: [
      // Core covered-call & high-income
      "JEPI", "JEPQ", "QYLD", "RYLD", "XYLD", "DIVO", "NUSI", "SDIV", "SPHD", "PFFD",
      // Additional monthly payers
      "GLDI", "SLVO", "MDIV", "DIVY", "HNDL", "PAYD", "XYLG", "HYLD", "AMLP", "BXMX",
    ],
  },
  {
    id: "quarterly-dividend-etfs",
    title: "Top Quarterly Dividend ETFs",
    description: "High-yielding ETFs with quarterly distributions and strong track records.",
    frequency: "Quarterly",
    tickers: [
      // Core dividend-growth
      "SCHD", "VYM", "HDV", "DVY", "DGRO", "VIG", "NOBL", "SDY", "FVD", "SPYD",
      // Additional quarterly payers
      "FDVV", "DGRW", "DTD", "RDIV", "IDV", "VYMI", "PEY", "DHS", "UTF", "PTY",
    ],
  },
  {
    id: "monthly-reits",
    title: "Top Monthly Dividend REITs",
    description: "Real Estate Investment Trusts that pay monthly dividends, combining real estate exposure with income.",
    frequency: "Monthly",
    tickers: [
      // Core REITs
      "O", "STAG", "MAIN", "GOOD", "AGNC", "NNN", "ADC", "IIPR", "LTC", "EPRT",
      // BDCs & mREITs also paying monthly
      "HTGC", "ARCC", "GAIN", "PSEC", "PFLT", "LADR", "HRZN", "BBDC", "OXSQ", "PNNT",
    ],
  },
  {
    id: "weekly-dividend-etfs",
    title: "Top Weekly Dividend ETFs",
    description: "Option-income ETFs that distribute dividends every week — the highest-frequency income available. High yield comes with NAV decay risk.",
    frequency: "Weekly",
    tickers: [
      // Roundhill 0DTE Covered Call (Friday)
      "QDTE", "XDTE", "RDTE",
      // YieldMax broad funds
      "YMAX", "YMAG", "FEPI",
      // YieldMax single-stock (Friday)
      "TSLY", "NVDY", "AMZY", "MSFO", "CONY",
      "APLY", "NFLY", "PLTY", "FBY", "AMDY",
      // Roundhill WeeklyPay (Mon–Thu)
      "MSFW", "METW", "MSTW", "GOOQ", "NFLW",
      "AMDW", "AMZW", "APLW", "NVDW", "TSLW",
    ],
  },
];

/**
 * Tickers that use covered-call / options strategies and are subject to NAV decay.
 * Used to show a risk warning badge in the UI.
 */
export const NAV_DECAY_RISK_TICKERS = new Set([
  // Roundhill 0DTE
  "QDTE", "XDTE", "RDTE",
  // YieldMax single-stock
  "TSLY", "NVDY", "AMZY", "MSFO", "CONY", "APLY", "NFLY", "PLTY", "FBY", "AMDY",
  "SNOY", "DISO", "JPMO", "OARK", "ULTY", "MARO", "SMCY", "HOODY",
  // YieldMax broad
  "YMAX", "YMAG", "ULTY",
  // Other covered-call
  "QYLD", "RYLD", "XYLD", "NUSI",
  // Roundhill WeeklyPay (leveraged)
  "MSFW", "METW", "MSTW", "GOOQ", "NFLW", "AMDW", "AMZW", "APLW",
  "NVDW", "TSLW", "COINW", "HOODW", "ARMW", "AVGOW",
]);

/** Map from ticker to its payment frequency — derived from curated lists. */
export const TICKER_FREQUENCY: Record<string, PayFrequency> = Object.fromEntries(
  CURATED_LISTS.flatMap((l) => l.tickers.map((t) => [t, l.frequency]))
);

export function getCuratedListById(id: string): CuratedList | undefined {
  return CURATED_LISTS.find((l) => l.id === id);
}
