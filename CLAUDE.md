# KPI Dashboard — project guide for Claude Code

This is a small Next.js (App Router, TypeScript) dashboard that shows business
metrics as tiles. The person working with you is a business owner, not an
engineer. Explain what you're doing in plain language, keep changes small, and
confirm numbers before trusting them.

## How the project is organized

- `app/page.tsx` — the one page. It loops over `metrics` from `lib/metrics/index.ts` and renders a tile per metric. You rarely need to touch this.
- `lib/metrics/types.ts` — the `Metric` type every tile follows, plus helpers (`env()`, `startOfMonthPacific()`).
- `lib/metrics/<system>.ts` — one file per system (hubspot, stripe, zendesk, freshdesk, quickbooks, csv-example, sample). Each exports one or more `Metric` objects.
- `lib/metrics/index.ts` — the registry. **The order of this array is the order on the page.**
- `scripts/check-metrics.ts` — `npm run check [filter]` prints every configured metric in the terminal. Use it to verify a number before wiring a tile.
- `data/` — CSV exports for systems without an API. Only `sample-metrics.csv` is tracked in git.
- `middleware.ts` — HTTP Basic Auth for the whole site when `DASHBOARD_PASSWORD` is set. Don't remove it; if the user wants no password, they unset the variable.
- `.env.example` — the list of env var names. Real values live in `.env.local` (gitignored) and on Vercel.

## Adding a metric (the standard loop)

1. If the system already has a file in `lib/metrics/`, add a new exported `Metric` to it. Otherwise create `lib/metrics/<system>.ts` following `sample.ts`.
2. Read secrets with `env("NAME")` from `types.ts`. List the names in `requiredEnv` so the tile hides itself when they're missing. Add the name to `.env.example` with a one-line comment on where to get it.
3. Register the metric in `lib/metrics/index.ts`.
4. Run `npm run check <id-fragment>` and show the user the printed number. Ask whether it looks right before moving on.
5. Only then confirm the tile renders at http://localhost:3000.

## Rules

- **Never print, log, echo, or commit a secret.** Never put a key in code or in a chat message. If the user pastes a key into the chat, tell them to put it in `.env.local` instead and don't repeat it.
- Use the built-in `fetch`. Don't add SDKs or npm packages for an API unless a plain HTTP call is impractical; fewer dependencies means fewer install failures.
- Prefer an API's count/total field over counting a page of results. Page sizes cap at 100 or 1000 and will silently give the wrong number.
- "This month" and "this week" mean the Pacific timezone (America/Los_Angeles). Use `startOfMonthPacific()`.
- Throw a clear `Error` on failure (include the HTTP status and the first 200 characters of the body). The tile shows the message so the user can paste it back to you.
- Keep every metric `fetch` under ~5 seconds. If an API is slow or rate-limited, fetch less or add an in-memory cache inside that metric file.
- Don't change `app/page.tsx` layout or styles unless asked. Don't add a database, auth, or a framework.
- Before committing, run `git status` and show it. `.env.local` and `data/*` (except the sample) must never appear.

## Deploying

The project deploys to Vercel from the GitHub repo on every push to `main`.
Env vars must be added in Vercel → Project → Settings → Environment Variables
with the same names as `.env.local`, then redeploy. If a build fails, read the
Vercel error, fix it locally, confirm `npm run build` passes, then push.
