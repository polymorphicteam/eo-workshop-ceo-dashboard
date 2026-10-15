import { env, startOfMonthPacific, type Metric } from "./types";

/**
 * HubSpot — Private App token (bearer).
 * Settings -> Integrations -> Private Apps -> Create app
 * Scopes: crm.objects.contacts.read, crm.objects.deals.read
 * Docs: https://developers.hubspot.com/docs/api/crm/search
 */

async function hubspotSearch(object: "deals" | "contacts" | "tickets", filters: object[]) {
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${object}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("HUBSPOT_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filterGroups: [{ filters }], limit: 1 }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${(await res.text()).slice(0, 200)}`);
  // `total` is the full count regardless of page size — use it, don't count results.
  const json = (await res.json()) as { total: number };
  return json.total;
}

export const hubspotDealsThisMonth: Metric = {
  id: "hubspot-deals-this-month",
  label: "Deals created this month",
  source: "HubSpot",
  requiredEnv: ["HUBSPOT_TOKEN"],
  async fetch() {
    const since = new Date(`${startOfMonthPacific()}T07:00:00Z`).getTime();
    const total = await hubspotSearch("deals", [
      { propertyName: "createdate", operator: "GTE", value: String(since) },
    ]);
    return { value: total, note: `since ${startOfMonthPacific()}` };
  },
};

export const hubspotOpenDeals: Metric = {
  id: "hubspot-open-deals",
  label: "Open deals",
  source: "HubSpot",
  requiredEnv: ["HUBSPOT_TOKEN"],
  async fetch() {
    const total = await hubspotSearch("deals", [
      { propertyName: "dealstage", operator: "NOT_IN", values: ["closedwon", "closedlost"] },
    ]);
    return { value: total };
  },
};

export const hubspotContactsThisMonth: Metric = {
  id: "hubspot-contacts-this-month",
  label: "New contacts this month",
  source: "HubSpot",
  requiredEnv: ["HUBSPOT_TOKEN"],
  async fetch() {
    const since = new Date(`${startOfMonthPacific()}T07:00:00Z`).getTime();
    const total = await hubspotSearch("contacts", [
      { propertyName: "createdate", operator: "GTE", value: String(since) },
    ]);
    return { value: total, note: `since ${startOfMonthPacific()}` };
  },
};
