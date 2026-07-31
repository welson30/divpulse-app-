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
 * or, for equities, the company — is matched to a domain here first and
 * the logo is served from that domain's favicon; anything the list
 * doesn't cover (arbitrary free-text search results, mostly) falls
 * through to Logo.dev by ticker before giving up to a monogram.
 *
 * Deliberately a pure function: no network call and no database, so
 * resolution costs nothing and can't undo the batching win in
 * fetchQuotes/fetchSparklines — it only ever builds a URL string, never
 * fetches one to check it. Anything unmatched returns null and the
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
  ["nuveen", "nuveen.com"],
  ["franklin", "franklintempleton.com"],
  ["putnam", "putnam.com"],
  ["john hancock", "jhinvestments.com"],
  ["hartford", "hartfordfunds.com"],
  ["principal", "principal.com"],
  ["virtus", "virtus.com"],
  ["eaton vance", "eatonvance.com"],
  ["abrdn", "abrdn.com"],
  ["innovator", "innovatoretfs.com"],
  ["kraneshares", "kraneshares.com"],
  ["columbia", "columbiathreadneedleus.com"],
  ["rex shares", "rexshares.com"],
  ["kurv", "kurvinvest.com"],
  ["harbor capital", "harborcapital.com"],
  ["avantis", "avantisinvestors.com"],
  ["dimensional", "dimensional.com"],
  ["janus henderson", "janushenderson.com"],
  ["allianzim", "allianzim.com"],
  ["calamos", "calamos.com"],
  ["tidal", "tidaletf.com"],
  ["baillie gifford", "bailliegifford.com"],

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
  ["iron mountain", "ironmountain.com"],
  ["kimco", "kimcorealty.com"],
  ["public storage", "publicstorage.com"],
  ["digital realty", "digitalrealty.com"],
  ["welltower", "welltower.com"],
  ["duke energy", "duke-energy.com"],
  ["southern company", "southerncompany.com"],
  ["nextera", "nexteraenergy.com"],
  ["dominion energy", "dominionenergy.com"],
  ["abbvie", "abbvie.com"],
  ["merck", "merck.com"],
  ["eli lilly", "lilly.com"],
  ["bristol-myers", "bms.com"],
  ["international business machines", "ibm.com"],
  ["cisco", "cisco.com"],
  ["intel corp", "intel.com"],
  ["texas instruments", "ti.com"],
  ["broadcom", "broadcom.com"],
  ["qualcomm", "qualcomm.com"],
  ["united parcel", "ups.com"],
  ["lockheed", "lockheedmartin.com"],
  ["caterpillar", "caterpillar.com"],
  ["walmart", "walmart.com"],
  ["target corp", "target.com"],
  ["costco", "costco.com"],
  ["starbucks", "starbucks.com"],
  ["visa inc", "visa.com"],
  ["mastercard", "mastercard.com"],
  ["bank of america", "bankofamerica.com"],
  ["wells fargo", "wellsfargo.com"],
  ["citigroup", "citigroup.com"],
  ["berkshire hathaway", "berkshirehathaway.com"],
];

/**
 * Google's favicon service: no API key, no rate limit to manage, and it
 * resolves for any domain including the ETF issuers above (verified).
 * 128px is comfortably larger than the 24–36px slots it renders into.
 */
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_KEY;

/**
 * Second-choice logo source for anything the static list above misses —
 * Logo.dev covers 70k+ tickers including ETFs by ticker symbol directly, no
 * issuer-name matching needed. `fallback=404` (instead of Logo.dev's own
 * default monogram) lets TickerLogo's `onError` handler catch a miss and
 * drop to the app's own styled monogram, so every fallback in the app looks
 * the same regardless of which source failed to resolve it.
 *
 * Free tier requires visible attribution ("Logos provided by Logo.dev") on
 * a public production page — added to the site footer.
 */
function logoDevUrl(ticker: string): string | null {
  if (!LOGO_DEV_TOKEN) return null;
  return `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${LOGO_DEV_TOKEN}&fallback=404`;
}

/**
 * Resolves a logo URL for a security. Tries the curated name match first
 * (known-good domains for the app's actual portfolio), then falls back to
 * Logo.dev by ticker, then null (monogram).
 */
export function resolveLogoUrl(name: string | null | undefined, ticker?: string | null): string | null {
  if (name) {
    const haystack = name.toLowerCase();
    for (const [match, domain] of NAME_TO_DOMAIN) {
      if (haystack.includes(match)) return faviconUrl(domain);
    }
  }
  return ticker ? logoDevUrl(ticker) : null;
}
