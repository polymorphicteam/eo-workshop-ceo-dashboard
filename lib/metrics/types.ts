/**
 * Every metric on the dashboard is one object of this shape, in its own file
 * under lib/metrics/, and registered in lib/metrics/index.ts.
 */
export type MetricResult = {
  /** The number to display. */
  value: number;
  /** Optional: how to format it. Defaults to "number". */
  format?: "number" | "currency" | "percent" | "duration";
  /** Optional: a short line under the number, e.g. "since Oct 1" or "as of 9:41am". */
  note?: string;
};

export type Metric = {
  /** Stable id, lowercase with dashes. Used as the React key. */
  id: string;
  /** What the tile says, e.g. "Open support tickets". */
  label: string;
  /** Where the number comes from, shown small on the tile, e.g. "HubSpot". */
  source: string;
  /**
   * Env vars this metric needs. If any are missing, the tile shows
   * "Not configured" instead of calling fetch(). Keeps the dashboard
   * working for everyone even when only one system is connected.
   */
  requiredEnv?: string[];
  /** Go get the number. Throw on failure; the tile will show the error. */
  fetch: () => Promise<MetricResult>;
};

/** Read an env var or throw a helpful error naming it. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env.local (see .env.example)`);
  return v;
}

/** First day of the current month in the Pacific timezone, as an ISO date (YYYY-MM-DD). */
export function startOfMonthPacific(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}-01`;
}

/** Same as above but as a Unix timestamp in seconds (Stripe and others use this). */
export function startOfMonthPacificUnix(): number {
  // Pacific is UTC-7 or UTC-8; 08:00 UTC on the 1st is safely inside that day either way.
  return Math.floor(new Date(`${startOfMonthPacific()}T08:00:00Z`).getTime() / 1000);
}
