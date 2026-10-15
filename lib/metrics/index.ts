import type { Metric } from "./types";
import { sampleOpenTickets, sampleMrr, sampleLeads } from "./sample";
import { csvOpenTickets } from "./csv-example";
import { hubspotDealsThisMonth, hubspotOpenDeals, hubspotContactsThisMonth } from "./hubspot";
import { stripeMrr, stripeRevenueThisMonth } from "./stripe";
import { zendeskOpenTickets, zendeskTicketsThisWeek } from "./zendesk";
import { freshdeskOpenTickets } from "./freshdesk";
import { qboOpenInvoices, qboInvoicedThisMonth } from "./quickbooks";

/**
 * THE DASHBOARD IS THIS LIST. Order here = order on the page.
 *
 * To add a metric: create lib/metrics/<system>-<metric>.ts exporting a Metric,
 * import it above, and add it to this array.
 *
 * Metrics whose `requiredEnv` vars are missing show "Not configured" rather than
 * erroring, so it's safe to leave connectors you don't use in this list — or
 * delete them to keep the page clean.
 */
export const metrics: Metric[] = [
  // Sample tiles — replace or remove as you connect real systems.
  sampleOpenTickets,
  sampleMrr,
  sampleLeads,
  csvOpenTickets,

  // Real connectors — each appears only once its env vars are set.
  hubspotDealsThisMonth,
  hubspotOpenDeals,
  hubspotContactsThisMonth,
  stripeMrr,
  stripeRevenueThisMonth,
  zendeskOpenTickets,
  zendeskTicketsThisWeek,
  freshdeskOpenTickets,
  qboOpenInvoices,
  qboInvoicedThisMonth,
];

/** True when every env var a metric needs is present. */
export function isConfigured(m: Metric): boolean {
  return (m.requiredEnv ?? []).every((name) => !!process.env[name]);
}
