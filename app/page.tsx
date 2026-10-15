import { metrics, isConfigured } from "@/lib/metrics";
import type { Metric, MetricResult } from "@/lib/metrics/types";

// Always fetch fresh numbers; never serve a cached page.
export const dynamic = "force-dynamic";

type TileState =
  | { kind: "ok"; result: MetricResult }
  | { kind: "error"; message: string }
  | { kind: "unconfigured"; missing: string[] };

async function load(m: Metric): Promise<TileState> {
  if (!isConfigured(m)) {
    return { kind: "unconfigured", missing: (m.requiredEnv ?? []).filter((n) => !process.env[n]) };
  }
  try {
    return { kind: "ok", result: await m.fetch() };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

function formatValue(r: MetricResult): string {
  const v = r.value;
  switch (r.format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2,
      }).format(v);
    case "percent":
      return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v)}%`;
    case "duration": {
      // value is in minutes
      if (v < 60) return `${Math.round(v)} min`;
      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);
      return m ? `${h}h ${m}m` : `${h}h`;
    }
    default:
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v);
  }
}

export default async function Page() {
  // Hide connectors that aren't set up, unless SHOW_UNCONFIGURED=1 (useful while debugging).
  const visible = metrics.filter((m) => isConfigured(m) || process.env.SHOW_UNCONFIGURED === "1");
  const states = await Promise.all(visible.map(load));
  const updated = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <main>
      <header>
        <h1>{process.env.DASHBOARD_TITLE || "KPI Dashboard"}</h1>
        <span className="updated">Updated {updated} PT</span>
      </header>

      {visible.length === 0 ? (
        <div className="empty">
          No metrics configured yet. Add keys to <code>.env.local</code> or register a metric in{" "}
          <code>lib/metrics/index.ts</code>.
        </div>
      ) : (
        <div className="grid">
          {visible.map((m, i) => {
            const s = states[i];
            if (s.kind === "ok") {
              return (
                <div className="tile" key={m.id}>
                  <div className="label">{m.label}</div>
                  <div className="value">{formatValue(s.result)}</div>
                  <div className="meta">
                    <span>{s.result.note ?? ""}</span>
                    <span>{m.source}</span>
                  </div>
                </div>
              );
            }
            if (s.kind === "error") {
              return (
                <div className="tile error" key={m.id}>
                  <div className="label">{m.label}</div>
                  <div className="value">{s.message}</div>
                  <div className="meta">
                    <span>Paste this error to Claude</span>
                    <span>{m.source}</span>
                  </div>
                </div>
              );
            }
            return (
              <div className="tile unconfigured" key={m.id}>
                <div className="label">{m.label}</div>
                <div className="value">Not configured</div>
                <div className="meta">
                  <span>Missing {s.missing.join(", ")}</span>
                  <span>{m.source}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <footer>
        {!process.env.DASHBOARD_PASSWORD && (
          <p>
            This dashboard has no password. Set <code>DASHBOARD_PASSWORD</code> in <code>.env.local</code> and on
            Vercel to require one.
          </p>
        )}
        Numbers are fetched live on every page load. To add a tile, create a file in <code>lib/metrics/</code> and
        register it in <code>lib/metrics/index.ts</code>.
      </footer>
    </main>
  );
}
