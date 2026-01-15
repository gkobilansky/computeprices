---
date: 2025-12-01T13:00:25-05:00
researcher: Codex
git_commit: d7364a5d053ac094959508d1ac0d9236f91751e7
branch: main
repository: computeprices
topic: "Price trend chart for Top Picks GPUs"
tags: [research, codebase, pricing, trends, supabase]
status: complete
last_updated: 2025-12-01
last_updated_by: Codex
---

# Research: Price trend chart for Top Picks GPUs

**Date**: 2025-12-01T13:00:25-05:00  
**Researcher**: Codex  
**Git Commit**: d7364a5d053ac094959508d1ac0d9236f91751e7  
**Branch**: main  
**Repository**: computeprices

## Research Question
Show an average price trend chart below the Top Picks section for each GPU (cheapest/most popular/top of the line). How are prices captured today, what is needed to calculate and display 7d/30d trendlines across providers, and is additional data required? Pull current price trend data from the DB via Supabase if possible.

## Summary
- Prices are captured into a `prices` fact table with `created_at`, one row per scrape insert (no updates); a `get_latest_prices` RPC returns the most recent row per provider/GPU and is what the UI consumes, so historical data is available in the table but not exposed in queries.
- Scrapers (Next.js cron routes + legacy Node scripts) ingest provider pricing and insert fresh rows into `prices`; Top Picks uses client-side `useGPUData` → `fetchGPUPrices` → `get_latest_prices`, so the new chart will need a separate historical endpoint.
- Latest data pull (Supabase JS with `.env.local` creds) shows: Cheapest RTX A4000 7d avg ~$0.87/hr (30d ~$0.89), Most Popular H100 7d avg ~$7.78/hr (22d window due to 1000-row cap), Top B200 7d avg ~$12.28/hr (30d ~$13.78). Daily sample counts suggest multiple inserts per day per GPU.
- Supabase API `max_rows` is 1000, so fetching raw rows for high-churn GPUs (e.g., H100) truncates to ~22 days; trend aggregation should happen server-side (RPC/view) that groups by day/provider to avoid limits and excess payload.
- Additional data not strictly needed; we already store `price_per_hour`, `provider_id`, `gpu_model_id`, and timestamps. We do need a consistent “latest per provider per day” rule to avoid double-counting multiple scrapes per day when averaging.

## Detailed Findings

### Price capture and storage
- Schema stores pricing in `prices` with `provider_id`, `gpu_model_id`, `price_per_hour`, optional `gpu_count`, source fields, and `created_at` timestamp for every insert; public read RLS is enabled and indexed on provider/GPU/created_at (`supabase/migrations/00001_initial_schema.sql:63-158`).
- `get_latest_prices` RPC selects the newest row per provider/GPU via `DISTINCT ON`, returning provider/gpu metadata; this is the only RPC used by the app for prices (`supabase/migrations/00001_initial_schema.sql:101-155`).
- Ingestion runs through cron GET routes per provider (e.g., AWS) that scrape/prase, match GPU models, and insert rows into `prices` with source metadata (`app/api/cron/aws/route.ts:23-154`). Legacy Node scripts in `scripts/` mirror this pattern for local runs.
- Manual backfill is supported via `scripts/add-manual-price.js`, which inserts into `prices` with operator-provided fields (not yet used for trends).

### Current UI consumption
- Top Picks (`Superlatives`) calls `useGPUData({ ignoreContext: true })` to fetch all latest prices client-side, then derives cheapest (min price) and most popular (highest row count per GPU) and hardcodes “B200” for top-of-line (`components/Superlatives.jsx:6-142`).
- `useGPUData` wraps `fetchGPUPrices`, which calls the `get_latest_prices` RPC; no historical data is fetched (`lib/hooks/useGPUData.js:7-45`, `lib/utils/fetchGPUData.js:22-58`).
- The main comparison table filters to the last 30 days by `created_at`, but because `get_latest_prices` already returns only the newest row per provider/GPU, the filter is effectively a recency guard rather than a history fetch (`components/GPUComparisonTableClient.jsx:9-127`).

### Trend readiness and gaps
- Historical data exists in `prices`, but no RPC/view exposes per-day or per-provider history. Multiple scrapes per provider/day mean averages must deduplicate (e.g., keep latest per provider per day) before computing a cross-provider mean.
- Supabase PostgREST `max_rows` is capped at 1000 (`supabase/config.toml:7-18`); high-volume GPUs like H100 exceed this when pulling raw rows over 30 days, truncating the window (~22 days returned when ordered desc).
- Need a new RPC or view such as:
  - `SELECT date_trunc('day', created_at) AS day, gpu_model_id, AVG(price_per_hour) AS avg_price, COUNT(DISTINCT provider_id) AS providers FROM (SELECT DISTINCT ON (provider_id, gpu_model_id, date(created_at)) ...) GROUP BY 1,2 ORDER BY day;`
  - This keeps payload small (≤30 rows per GPU) and bypasses the 1000-row cap.
- Frontend will need a separate fetch path (server component or client hook) to request 7d/30d aggregates for a GPU, independent of `get_latest_prices`.

### Data pull snapshot (Supabase, 2025-12-01)
- Command: `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config --input-type=module` (ad-hoc script using `@supabase/supabase-js` and `get_latest_prices` to pick targets, then querying `prices` for last 30 days).
- Top pick targets from live data: Cheapest RTX A4000 @ $0.055/hr, Most Popular H100 @ $2.40/hr (latest record), Top B200 @ $8.60/hr.
- Aggregated averages (cross-provider, simple mean of all rows per day):
  - RTX A4000: 30 days of data (2025-11-02→2025-12-01), 7d avg ~$0.87/hr, 30d avg ~$0.89/hr; ~12 rows/day indicates multiple inserts per day.
  - H100: 22 days returned (2025-11-10→2025-12-01) due to 1000-row cap; 7d avg ~$7.78/hr, 22d avg ~$8.08/hr; ~45 rows/day, so aggregation should dedupe per provider/day.
  - B200: 30 days (2025-11-02→2025-12-01), 7d avg ~$12.28/hr, 30d avg ~$13.78/hr; ~9 rows/day.
- Risk: ordering ascending with the 1000-row cap dropped the most recent H100 days; ordering desc restored recency but still trims window. Server-side aggregation is required for accurate 30d series.

### Additional data needs
- None required for averages (all needed fields exist), but we should define:
  - How to collapse multiple daily scrapes (latest per provider per day recommended).
  - Whether to exclude rows older than 30d at query time to keep payloads lean.
  - Whether to include provider count per day to annotate chart coverage gaps.

## Code References
- `supabase/migrations/00001_initial_schema.sql:63-155` – `prices` table definition, indexes, and `get_latest_prices` RPC returning newest row per provider/GPU.
- `app/api/cron/aws/route.ts:23-154` – Example cron scraper inserting fresh rows into `prices`.
- `components/Superlatives.jsx:6-142` – Top Picks derives cheapest/most popular from `useGPUData` results and hardcodes B200.
- `lib/hooks/useGPUData.js:7-45` and `lib/utils/fetchGPUData.js:22-58` – Client data hook and RPC call to `get_latest_prices`; no historical fetching.
- `components/GPUComparisonTableClient.jsx:9-127` – Table filters results to last 30 days but is fed by latest-only RPC.
- `supabase/config.toml:7-18` – `max_rows = 1000` caps PostgREST responses, impacting raw history pulls.

## Architecture Insights
- Existing data model already supports time series via `created_at`; only query surfaces and aggregation logic are missing.
- A dedicated RPC/view that dedupes to “latest per provider per day” and returns daily aggregates will prevent row-cap truncation and avoid shipping thousands of raw rows to the browser.
- Frontend should fetch the aggregate via server components (or a thin client hook) and render 7d/30d datasets; avoid reusing `get_latest_prices` for trends.
- Consider caching the aggregate (ISR or edge cache) since scrapes are daily; chart can be hydrated with static data and refreshed periodically.

## Historical Context (from thoughts/)
No `thoughts/` directory or prior notes found.

## Related Research
None relevant found.

## Open Questions
- Should the average be computed from the latest price per provider per day (recommended) or from all inserts? What about providers with multiple SKUs/tiers for the same GPU?
- Do we want median/min/max alongside average to show volatility, especially for high-variance GPUs like H100?
- Should we backfill a materialized daily aggregate table to avoid recomputing on each request?
- How should we visualize provider coverage drops (e.g., days with fewer providers or missing rows)?
