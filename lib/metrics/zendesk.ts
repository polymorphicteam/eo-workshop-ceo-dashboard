import { env, type Metric } from "./types";

/**
 * Zendesk — API token with basic auth. Username is "<email>/token".
 * Admin Center -> Apps and integrations -> APIs -> Zendesk API -> Add API token
 * Docs: https://developer.zendesk.com/api-reference/ticketing/ticket-management/search/#count-search-results
 */

async function zendeskCount(query: string): Promise<number> {
  const sub = env("ZENDESK_SUBDOMAIN");
  const auth = Buffer.from(`${env("ZENDESK_EMAIL")}/token:${env("ZENDESK_TOKEN")}`).toString("base64");
  const url = `https://${sub}.zendesk.com/api/v2/search/count.json?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Zendesk ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { count: number };
  return json.count;
}

export const zendeskOpenTickets: Metric = {
  id: "zendesk-open-tickets",
  label: "Open support tickets",
  source: "Zendesk",
  requiredEnv: ["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_TOKEN"],
  async fetch() {
    const value = await zendeskCount("type:ticket status<solved");
    return { value };
  },
};

export const zendeskTicketsThisWeek: Metric = {
  id: "zendesk-tickets-this-week",
  label: "Tickets created last 7 days",
  source: "Zendesk",
  requiredEnv: ["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_TOKEN"],
  async fetch() {
    const d = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const value = await zendeskCount(`type:ticket created>${d}`);
    return { value, note: `since ${d}` };
  },
};
