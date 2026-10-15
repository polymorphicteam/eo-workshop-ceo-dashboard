import { env, startOfMonthPacific, type Metric } from "./types";

/**
 * QuickBooks Online — OAuth 2.0. The slow one to set up (~30 min), so do a
 * simpler system first if you're short on time.
 *
 * One-time setup:
 *  1. developer.intuit.com -> Create an app (QuickBooks Online and Payments)
 *  2. Keys & credentials -> copy Client ID and Client Secret
 *  3. Open the OAuth 2.0 Playground, pick scope com.intuit.quickbooks.accounting,
 *     authorize your company, and copy the Refresh Token and Realm ID
 *  4. Put all four in .env.local (QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN, QBO_REALM_ID)
 *
 * Intuit rotates refresh tokens; the newest one is logged to the server console when it
 * changes. Copy it into .env.local and Vercel when that happens (every ~24h of use).
 * Docs: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
 */

let cached: { accessToken: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;
  const basic = Buffer.from(`${env("QBO_CLIENT_ID")}:${env("QBO_CLIENT_SECRET")}`).toString("base64");
  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: env("QBO_REFRESH_TOKEN") }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`QuickBooks token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { access_token: string; expires_in: number; refresh_token: string };
  if (json.refresh_token && json.refresh_token !== process.env.QBO_REFRESH_TOKEN) {
    console.warn("[quickbooks] Refresh token rotated. Update QBO_REFRESH_TOKEN in .env.local and on Vercel.");
  }
  cached = { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cached.accessToken;
}

async function qboQuery<T = any>(sql: string): Promise<T[]> {
  const host = process.env.QBO_ENV === "sandbox" ? "sandbox-quickbooks.api.intuit.com" : "quickbooks.api.intuit.com";
  const url = `https://${host}/v3/company/${env("QBO_REALM_ID")}/query?query=${encodeURIComponent(sql)}&minorversion=75`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await accessToken()}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`QuickBooks ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const response = json.QueryResponse ?? {};
  const key = Object.keys(response).find((k) => Array.isArray(response[k]));
  return key ? response[key] : [];
}

export const qboOpenInvoices: Metric = {
  id: "qbo-open-invoices",
  label: "Unpaid invoices (A/R)",
  source: "QuickBooks",
  requiredEnv: ["QBO_CLIENT_ID", "QBO_CLIENT_SECRET", "QBO_REFRESH_TOKEN", "QBO_REALM_ID"],
  async fetch() {
    const invoices = await qboQuery<{ Balance: number }>("SELECT Balance FROM Invoice WHERE Balance > '0' MAXRESULTS 1000");
    const total = invoices.reduce((s, i) => s + Number(i.Balance ?? 0), 0);
    return { value: total, format: "currency", note: `${invoices.length} open invoices` };
  },
};

export const qboInvoicedThisMonth: Metric = {
  id: "qbo-invoiced-this-month",
  label: "Invoiced this month",
  source: "QuickBooks",
  requiredEnv: ["QBO_CLIENT_ID", "QBO_CLIENT_SECRET", "QBO_REFRESH_TOKEN", "QBO_REALM_ID"],
  async fetch() {
    const since = startOfMonthPacific();
    const invoices = await qboQuery<{ TotalAmt: number }>(`SELECT TotalAmt FROM Invoice WHERE TxnDate >= '${since}' MAXRESULTS 1000`);
    const total = invoices.reduce((s, i) => s + Number(i.TotalAmt ?? 0), 0);
    return { value: total, format: "currency", note: `${invoices.length} invoices since ${since}` };
  },
};
