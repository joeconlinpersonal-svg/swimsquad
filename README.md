# Squad Swim Tracker

A small shareable dashboard for the squad's swim times: 50/100/200/400/1000m
PBs per swimmer, and pace-over-time charts for 400m and 1000m. Anyone with the
link can log a new swim.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL` set, the app runs on an
in-memory store seeded from the squad's original spreadsheet — good for
poking around, but it resets whenever the server restarts.

## Deploying to Vercel (free plan)

1. **Push this repo to GitHub** (or GitLab/Bitbucket).
2. **Import it into Vercel**: [vercel.com/new](https://vercel.com/new) → select the repo → Deploy.
   It'll build fine with no database configured, but data won't persist between
   requests in production — do step 3 before sharing the link.
3. **Add a free Postgres database**: in the Vercel project → **Storage** tab →
   **Create Database** → choose **Neon** (Postgres) → free tier → connect it
   to this project. Vercel will automatically set a `DATABASE_URL` (or
   `POSTGRES_URL`/`DATABASE_URL`-style) environment variable — if it names the
   variable something other than `DATABASE_URL`, add a `DATABASE_URL` env var
   in **Settings → Environment Variables** pointing to the same connection
   string.
4. **Redeploy** (Vercel does this automatically after the database connects).
   The first request creates the `swimmers`/`entries` tables and seeds them
   from the original spreadsheet automatically — no migration step needed.
5. Share the Vercel URL with the squad. Anyone can hit **+ Log a swim** to add
   a new time (existing swimmer or a new one), and everyone sees the same
   shared data.

## How it's structured

- `src/lib/seedData.ts` — the original spreadsheet data, transcribed.
- `src/lib/pgStore.ts` / `src/lib/memoryStore.ts` — the two storage
  backends behind a shared `SwimStore` interface (`src/lib/store.ts` picks
  Postgres when `DATABASE_URL` is set, otherwise the in-memory fallback).
- `src/app/api/swimmers`, `src/app/api/entries` — the two API routes (list/add
  swimmer, add a timed swim).
- `src/components/Dashboard.tsx` — the page: trend charts + swimmer cards +
  the add-swim modal.
