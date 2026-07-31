/**
 * Ticker → logo URL resolution.
 *
 * No financial API exposes logos for ETFs: Yahoo has no logo field at
 * all, its `assetProfile.website` is populated for equities but null for
 * every fund tested, and Finnhub's logo coverage is equity-only. Since a
 * dividend portfolio is largely ETFs, an ETF-blind approach would show a
 * monogram for nearly every row.
 *
 * What is reliable is the fund's own name: Yahoo's `longName` always
 * leads with the issuer ("Roundhill Innovation-100…", "JPMorgan Equity
 * Premium…"), and issuers are a short, slow-moving list. So the issuer —
 * or, for equities, the company — is matched to a domain here and the
 * logo is served from that domain's favicon.
 *
 * Deliberately a pure function: no network call and no database, so
 * resolution costs nothing and can't undo the batching win in
 * fetchQuotes/fetchSparklines. Anything unmatched returns null and the
 * caller falls back to a monogram.
 */

/** Matched against the lowercased security name, first hit wins. Order matters where names overlap. */
const NAME_TO_DOMAIN: Array<[match: string, domain: string]> = [
  // --- ETF / fund issuers ---
  ["roundhill", "roundhillinvestments.com"],
  ["yieldmax", "yieldmaxetfs.com"],
  ["jpmorgan", "jpmorgan.com"],
  ["j.p. morgan", "jpmorgan.com"],
  ["vanguard", "vanguard.com"],
  ["schwab", "schwab.com"],
  ["invesco", "invesco.com"],
  ["neos", "neosfunds.com"],
  ["global x", "globalxetfs.com"],
  ["ishares", "ishares.com"],
  ["blackrock", "blackrock.com"],
  ["spdr", "ssga.com"],
  ["state street", "ssga.com"],
  ["fidelity", "fidelity.com"],
  ["first trust", "ftportfolios.com"],
  ["proshares", "proshares.com"],
  ["direxion", "direxion.com"],
  ["grayscale", "grayscale.com"],
  ["amplify", "amplifyetfs.com"],
  ["defiance", "defianceetfs.com"],
  ["simplify", "simplify.us"],
  ["pacer", "paceretfs.com"],
  ["wisdomtree", "wisdomtree.com"],
  ["vaneck", "vaneck.com"],
  ["t. rowe", "troweprice.com"],
  ["pimco", "pimco.com"],
  ["doubleline", "doubleline.com"],
  ["cambiar", "cambiar.com"],
  ["matthews", "matthewsasia.com"],
  ["goldman sachs", "goldmansachs.com"],
  ["morgan stanley", "morganstanley.com"],

  // --- common dividend equities ---
  ["coca-cola", "coca-colacompany.com"],
  ["realty income", "realtyincome.com"],
  ["johnson & johnson", "jnj.com"],
  ["procter & gamble", "pg.com"],
  ["verizon", "verizon.com"],
  ["at&t", "att.com"],
  ["pfizer", "pfizer.com"],
  ["chevron", "chevron.com"],
  ["exxon", "exxonmobil.com"],
  ["altria", "altria.com"],
  ["3m ", "3m.com"],
  ["mcdonald", "mcdonalds.com"],
  ["pepsico", "pepsico.com"],
  ["home depot", "homedepot.com"],
  ["microsoft", "microsoft.com"],
  ["apple inc", "apple.com"],
  ["nvidia", "nvidia.com"],
  ["southside banc", "southside.com"],
  ["plug power", "plugpower.com"],
  ["space exploration", "spacex.com"],
  ["agree realty", "agreerealty.com"],
  ["simon property", "simon.com"],
  ["prologis", "prologis.com"],
  ["vici", "viciproperties.com"],
  ["main street capital", "mainstcapital.com"],
  ["ares capital", "arescapitalcorp.com"],
  ["hercules capital", "htgc.com"],
];

/**
 * Google's favicon service: no API key, no rate limit to manage, and it
 * resolves for any domain including the ETF issuers above (verified).
 * 128px is comfortably larger than the 24–36px slots it renders into.
 */
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/** Resolves a logo URL from a security's display name, or null when unmatched. */
export function resolveLogoUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  const haystack = name.toLowerCase();
  for (const [match, domain] of NAME_TO_DOMAIN) {
    if (haystack.includes(match)) return faviconUrl(domain);
  }
  return null;
}
