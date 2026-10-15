/**
 * Password login for the dashboard.
 *
 * One env var, DASHBOARD_PASSWORD, is the password. When it's set, visitors see
 * /login and must enter it; a signed, httpOnly cookie then keeps them in for
 * SESSION_DAYS. When it's unset the site is open (handy on localhost).
 *
 * Uses only Web Crypto so it runs in both the middleware (edge) and route handlers.
 */

export const COOKIE_NAME = "dashboard_session";
export const SESSION_DAYS = 30;

export function passwordEnabled(): boolean {
  return !!process.env.DASHBOARD_PASSWORD;
}

/** The cookie value is an HMAC of a fixed message keyed by the password, so changing the password logs everyone out. */
export async function sessionToken(): Promise<string> {
  const password = process.env.DASHBOARD_PASSWORD ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("kpi-dashboard-session-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken());
}
