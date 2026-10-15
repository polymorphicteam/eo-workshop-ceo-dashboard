import { env, type Metric } from "./types";

/**
 * Freshdesk — API key with basic auth; the password is literally "X".
 * Profile avatar -> Profile settings -> "Your API key"
 * Docs: https://developers.freshdesk.com/api/#filter_tickets
 * Status codes: 2 open, 3 pending, 4 resolved, 5 closed
 */

async function freshdeskGet(path: string) {
  const domain = env("FRESHDESK_DOMAIN"); // e.g. "acme" for acme.freshdesk.com
  const auth = Buffer.from(`${env("FRESHDESK_API_KEY")}:X`).toString("base64");
  const res = await fetch(`https://${domain}.freshdesk.com/api/v2/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Freshdesk ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export const freshdeskOpenTickets: Metric = {
  id: "freshdesk-open-tickets",
  label: "Open support tickets",
  source: "Freshdesk",
  requiredEnv: ["FRESHDESK_DOMAIN", "FRESHDESK_API_KEY"],
  async fetch() {
    // Filter endpoint returns { total, results } — use total, it isn't capped by page size.
    const json = (await freshdeskGet(`search/tickets?query="status:2 OR status:3"`)) as { total: number };
    return { value: json.total, note: "open + pending" };
  },
};
