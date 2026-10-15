/**
 * Prints every configured metric to the terminal without starting the web server.
 *
 *   npm run check              -> all configured metrics
 *   npm run check hubspot      -> only metrics whose id contains "hubspot"
 *
 * Reads .env.local the same way Next.js does. Use this to confirm a number
 * before wiring (or trusting) a tile.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Minimal .env.local loader (no dependency): KEY=value, optional quotes, # comments.
const envFile = path.join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

async function main() {
  const { metrics, isConfigured } = await import("../lib/metrics");
  const filter = process.argv[2]?.toLowerCase();
  const list = metrics.filter((m) => !filter || m.id.includes(filter));

  for (const m of list) {
    if (!isConfigured(m)) {
      const missing = (m.requiredEnv ?? []).filter((n) => !process.env[n]);
      console.log(`- ${m.label} (${m.source}): not configured, missing ${missing.join(", ")}`);
      continue;
    }
    const t0 = Date.now();
    try {
      const r = await m.fetch();
      console.log(`✓ ${m.label} (${m.source}): ${r.value}${r.note ? `  — ${r.note}` : ""}  [${Date.now() - t0}ms]`);
    } catch (e) {
      console.log(`✗ ${m.label} (${m.source}): ${e instanceof Error ? e.message : e}`);
    }
  }
}

main();
