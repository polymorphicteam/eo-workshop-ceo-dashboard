import { env, startOfMonthPacificUnix, type Metric } from "./types";

/**
 * Stripe — restricted secret key (bearer), read-only is enough.
 * Developers -> API keys -> Create restricted key
 * Docs: https://docs.stripe.com/api
 * Amounts come back in cents.
 */

async function stripeGet(path: string, params: Record<string, string>) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<{ data: any[]; has_more: boolean }>;
}

/** Walk every page of a Stripe list endpoint. */
async function stripeAll(path: string, params: Record<string, string>) {
  const all: any[] = [];
  let starting_after: string | undefined;
  for (;;) {
    const page = await stripeGet(path, { ...params, limit: "100", ...(starting_after ? { starting_after } : {}) });
    all.push(...page.data);
    if (!page.has_more) return all;
    starting_after = page.data[page.data.length - 1].id;
  }
}

export const stripeMrr: Metric = {
  id: "stripe-mrr",
  label: "Monthly recurring revenue",
  source: "Stripe",
  requiredEnv: ["STRIPE_SECRET_KEY"],
  async fetch() {
    const subs = await stripeAll("subscriptions", { status: "active", "expand[]": "data.items" });
    let cents = 0;
    for (const s of subs) {
      for (const item of s.items.data) {
        const price = item.price;
        const qty = item.quantity ?? 1;
        const amount = price.unit_amount ?? 0;
        const { interval, interval_count } = price.recurring ?? { interval: "month", interval_count: 1 };
        const perMonth =
          interval === "year" ? amount / (12 * interval_count)
          : interval === "week" ? (amount * 52) / (12 * interval_count)
          : interval === "day" ? (amount * 365) / (12 * interval_count)
          : amount / interval_count;
        cents += perMonth * qty;
      }
    }
    return { value: Math.round(cents) / 100, format: "currency", note: `${subs.length} active subscriptions` };
  },
};

export const stripeRevenueThisMonth: Metric = {
  id: "stripe-revenue-this-month",
  label: "Payments this month",
  source: "Stripe",
  requiredEnv: ["STRIPE_SECRET_KEY"],
  async fetch() {
    const charges = await stripeAll("charges", { "created[gte]": String(startOfMonthPacificUnix()) });
    const cents = charges.filter((c) => c.paid && !c.refunded).reduce((sum, c) => sum + c.amount, 0);
    return { value: cents / 100, format: "currency", note: `${charges.length} charges` };
  },
};
