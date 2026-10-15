import type { Metric } from "./types";

/**
 * SAMPLE METRIC — the pattern every real metric follows.
 *
 * 1. Export one `Metric` object.
 * 2. `requiredEnv` lists the env vars; the tile shows "Not configured" if they're missing.
 * 3. `fetch` returns { value, format?, note? } or throws.
 *
 * Copy this file, rename it to <system>-<metric>.ts, and add it to index.ts.
 */
export const sampleOpenTickets: Metric = {
  id: "sample-open-tickets",
  label: "Open support tickets",
  source: "Sample data",
  async fetch() {
    // Pretend we called an API.
    await new Promise((r) => setTimeout(r, 50));
    return { value: 42, note: "replace me with a real system" };
  },
};

export const sampleMrr: Metric = {
  id: "sample-mrr",
  label: "Monthly recurring revenue",
  source: "Sample data",
  async fetch() {
    return { value: 18750, format: "currency", note: "replace me with Stripe or QuickBooks" };
  },
};

export const sampleLeads: Metric = {
  id: "sample-leads",
  label: "Leads created this month",
  source: "Sample data",
  async fetch() {
    return { value: 27, note: "replace me with HubSpot" };
  },
};
