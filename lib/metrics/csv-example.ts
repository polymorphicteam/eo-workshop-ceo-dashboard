import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metric } from "./types";

/**
 * CSV FALLBACK — for systems without an API.
 *
 * Export from your system to data/<file>.csv, then compute the metric here.
 * The tile goes stale until you re-export and push, so say so in `note`.
 *
 * data/sample-metrics.csv is tracked in git as an example; everything else
 * in data/ is gitignored so real exports never get committed.
 */

/** Tiny CSV parser: handles quoted fields and commas inside quotes. No external dependency. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

export async function loadCsv(fileName: string): Promise<Record<string, string>[]> {
  const file = path.join(process.cwd(), "data", fileName);
  const text = await readFile(file, "utf8");
  return parseCsv(text);
}

export const csvOpenTickets: Metric = {
  id: "csv-open-tickets",
  label: "Open tickets (CSV)",
  source: "data/sample-metrics.csv",
  async fetch() {
    const rows = await loadCsv("sample-metrics.csv");
    const open = rows.filter((r) => r["Status"]?.toLowerCase() === "open").length;
    return { value: open, note: `from ${rows.length} rows; re-export to refresh` };
  },
};
