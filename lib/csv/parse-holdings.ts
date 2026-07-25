// Generic CSV holdings parser — not tied to any single broker's export
// format (ARCHITECTURE.md §9.3 names XP/Avenue/Nomad specifically, but
// without real sample exports to build against, a header-name-detecting
// generic parser covers any CSV with recognizable ticker/shares columns
// rather than guessing at proprietary layouts).

export type ParsedHoldingRow = { ticker: string; shares: number; brokerName: string | null };
export type ParseResult = { rows: ParsedHoldingRow[]; skipped: number };

const TICKER_HEADERS = ["ticker", "symbol", "ativo", "código", "codigo"];
const SHARES_HEADERS = ["shares", "quantity", "qty", "quantidade"];
const BROKER_HEADERS = ["broker", "broker_name", "corretora", "institution"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => candidates.includes(normalizeHeader(h)));
}

/** Minimal CSV line splitter — handles quoted fields with embedded commas, not full RFC 4180 (no embedded newlines in quotes). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseHoldingsCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], skipped: 0 };
  }

  const headers = splitCsvLine(lines[0]!);
  const tickerIdx = findColumnIndex(headers, TICKER_HEADERS);
  const sharesIdx = findColumnIndex(headers, SHARES_HEADERS);
  const brokerIdx = findColumnIndex(headers, BROKER_HEADERS);

  if (tickerIdx === -1 || sharesIdx === -1) {
    return { rows: [], skipped: lines.length - 1 };
  }

  const rows: ParsedHoldingRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const ticker = fields[tickerIdx]?.trim().toUpperCase();
    const sharesRaw = fields[sharesIdx]?.trim().replace(",", "."); // handles comma-as-decimal exports
    const shares = sharesRaw ? Number(sharesRaw) : NaN;

    if (!ticker || !Number.isFinite(shares) || shares <= 0) {
      skipped += 1;
      continue;
    }

    rows.push({
      ticker,
      shares,
      brokerName: brokerIdx !== -1 ? (fields[brokerIdx]?.trim() ?? null) : null,
    });
  }

  return { rows, skipped };
}
