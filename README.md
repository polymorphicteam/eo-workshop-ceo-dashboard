# KPI Dashboard Starter

One page, one tile per metric, numbers fetched live from the systems you already use.
Built for the EO LA Valley "vibe coding" workshop; meant to be extended with Claude Code
rather than edited by hand.

## Run it locally

```bash
git clone git@github.com:polymorphicteam/eo-workshop-ceo-dashboard.git my-dashboard
cd my-dashboard
npm install
cp .env.example .env.local
npm run dev        # open http://localhost:3000
```

You'll see sample tiles. Real connectors appear automatically once their keys are in `.env.local`.

## Connect a real system

1. Create an API key in the system (`.env.example` has the menu path for each).
2. Put it in `.env.local`, e.g. `HUBSPOT_TOKEN=pat-na1-...`
3. Restart `npm run dev`. The matching tiles show up.
4. Verify in the terminal: `npm run check hubspot`

Built-in connectors: HubSpot, Stripe, Zendesk, Freshdesk, QuickBooks Online, and a CSV reader for anything else.

## Add your own metric with Claude Code

Open `claude` in the project folder and say something like:

> Add a metric called "Unanswered calls this week" pulled from RingCentral. My token is in `.env.local` as `RC_JWT`. Follow the pattern in `lib/metrics/sample.ts`, register it in `lib/metrics/index.ts`, and run `npm run check` so I can confirm the number before you wire the tile.

`CLAUDE.md` tells Claude the conventions, so it will put files in the right place, keep secrets out of git, and verify the number first.

## Deploy

```bash
gh repo create my-dashboard --private --source=. --remote=origin --push
```

Then on vercel.com: Add New → Project → import the repo → add your env vars → Deploy.
Every later `git push` redeploys automatically.

## Password

Set `DASHBOARD_PASSWORD` in `.env.local` and in Vercel's Environment Variables. The browser prompts for it (any username, that password). Leave it unset on localhost to skip the prompt. See `middleware.ts`.

## Secrets

`.env.local` and everything in `data/` except the sample CSV are gitignored. Keys go in `.env.local` locally and in Vercel's Environment Variables in production. Never paste a key into a chat.
