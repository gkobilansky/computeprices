# Top Picks Price Trend Charts Implementation Plan

## Overview
Add three price trend charts immediately below the Top Picks tiles, showing 7d/30d moving averages for the dynamic Top Picks GPUs (cheapest, most popular, B200). Provide a server-side aggregate to avoid Supabase row caps and dedupe multiple scrapes per provider/day.

## Current State Analysis
- Top Picks tiles are client-rendered via `components/Superlatives.jsx`, fed by `useGPUData` → `fetchGPUPrices` → `get_latest_prices` RPC, which only returns the newest price per provider/GPU.
- Historical data exists in `prices` (`supabase/migrations/00001_initial_schema.sql:63-155`), but no RPC/view exposes per-day series. Supabase PostgREST is capped at 1000 rows (`supabase/config.toml:7-18`), so raw history pulls truncate high-churn GPUs.
- Homepage places the Superlatives block at `app/page.js:83-101`, the natural insertion point for the charts.

## Desired End State
- Three charts rendered under the Top Picks tiles, each toggling between 7d and 30d moving-average lines for its GPU, using daily averaged data across providers (latest price per provider per day).
- Backend surface (RPC/view + API/route) returns compact per-day series with provider counts and respects row caps.
- Charts stay in sync with current Top Picks selections (cheapest, most popular, B200) without UI flicker when data refreshes.

### Key Discoveries:
- `prices` stores all scrapes; `get_latest_prices` only exposes the most recent row per provider/GPU (`supabase/migrations/00001_initial_schema.sql:101-155`).
- Supabase API row cap at 1000 rows requires server-side daily aggregation to reliably fetch 30d windows for high-churn GPUs (`supabase/config.toml:7-18`).
- Superlatives is a client component; charts will also need to be client-side or a hybrid with a server data fetch wrapped for hydration (`components/Superlatives.jsx:6-142`, `app/page.js:83-101`).

## What We're NOT Doing
- No changes to Top Picks selection logic (still cheapest, most popular by count, hardcoded B200).
- No provider-level breakdown or median/min/max lines; only a single moving-average line with a 7d/30d toggle.
- No persistence/caching layer beyond ISR/Next fetch caching; no materialized tables.

## Implementation Approach
Create a Supabase RPC that returns daily aggregates (latest per provider per day) for a GPU over a requested window. Expose it via a thin Next API route or server utility, then build a client chart component beneath Superlatives that pulls data for the three Top Picks and renders a single-line chart with a 7d/30d toggle.

## Phase 1: Supabase Daily Aggregation RPC/View

### Overview
Add a SQL function/view that returns daily averages for a GPU: latest price per provider per day, averaged across providers, plus provider_count, ordered by day. Limit window (default 30d) to keep payload small and avoid the 1000-row cap.

### Changes Required:

#### 1. Supabase migration for daily trend RPC
**File**: `supabase/migrations/<new>.sql`  
**Changes**: Create `get_gpu_daily_trends(selected_gpu uuid, days int default 30)` (or a view) that:
- Dedupes to latest per provider per day (`DISTINCT ON (provider_id, date(created_at))` ordered by `created_at DESC`).
- Groups by day and gpu, returning `day::date`, `avg_price`, `provider_count`.
- Applies a `created_at >= now() - interval 'X days'` window.

```sql
RETURN QUERY
WITH daily AS (
  SELECT DISTINCT ON (p.provider_id, date(p.created_at))
    date(p.created_at) AS day,
    p.provider_id,
    p.gpu_model_id,
    p.price_per_hour
  FROM prices p
  WHERE p.gpu_model_id = selected_gpu
    AND p.created_at >= now() - (days || ' days')::interval
  ORDER BY p.provider_id, date(p.created_at), p.created_at DESC
)
SELECT day,
       gpu_model_id,
       avg(price_per_hour) AS avg_price_per_hour,
       count(DISTINCT provider_id) AS provider_count
FROM daily
GROUP BY day, gpu_model_id
ORDER BY day ASC;
```

### Success Criteria:

#### Automated Verification:
- [ ] Supabase migration applies locally without errors.
- [ ] RPC returns rows for sample GPU IDs with correct ordering and window limit.

#### Manual Verification:
- [ ] For a high-churn GPU (e.g., H100), 30d window is returned without truncation and shows reasonable provider_count values.

**Implementation Note**: After this phase, validate the RPC in the Supabase SQL console or via `supabase` CLI before wiring the frontend.

---

## Phase 2: Backend Fetch Surface

### Overview
Expose the daily trend RPC via a Next server route or server utility to keep Supabase keys server-side and deliver normalized JSON to the client (day, avg_price_per_hour, provider_count). Include minimal caching (Next fetch cache/ISR) since data changes daily.

### Changes Required:

#### 1. Trend fetch helper
**File**: `lib/utils/fetchPriceTrends.ts` (new)  
**Changes**: Server-side helper that calls the RPC for a given `gpuModelId` and `days`, normalizes to `{ day, avg, providers }[]`, and handles missing/empty data with graceful fallbacks.

#### 2. API route (optional but preferred for client isolation)
**File**: `app/api/gpu-trends/route.ts` (new)  
**Changes**: Accepts `gpuId` and `days` query params, calls the helper, returns JSON; apply simple input validation and `revalidate` hints if using ISR caching.

### Success Criteria:

#### Automated Verification:
- [x] Unit test for the helper to assert shape transformation and empty-state handling.
- [x] `npm run lint` passes.

#### Manual Verification:
- [ ] Hitting `/api/gpu-trends?gpuId=<id>&days=30` returns ascending days with avg and provider counts; 4xx on missing/invalid gpuId.

---

## Phase 3: Frontend Trend Charts

### Overview
Render three charts directly under the Top Picks tiles. Charts follow the live Top Picks GPUs (cheapest, most popular, B200) using the IDs resolved by Superlatives. Provide a toggle to switch between 7d and 30d moving averages on a single line per chart.

### Changes Required:

#### 1. Chart component
**File**: `components/TopPickTrends.jsx` (new, client)  
**Changes**: 
- Accepts the three GPU IDs/names from Superlatives context.
- Fetches daily series (via API route/helper) for each GPU for both 7d and 30d windows; computes moving average client-side if server returns raw daily averages.
- Renders a single-line chart per GPU with a shared toggle (7d vs 30d). Uses a lightweight chart lib (e.g., `recharts`); add dependency to `package.json`.
- Handles loading/empty states and short windows (e.g., <7 days) gracefully; show provider count annotations in tooltip.

#### 2. Wire into homepage
**File**: `app/page.js`  
**Changes**: Insert `TopPickTrends` below `<Superlatives />`, passing resolved GPU IDs/names (snapshot once per render to avoid flicker if data refetches).

```jsx
<section aria-label="Top Picks Trends" className="mt-4">
  <TopPickTrends picks={picksFromSuperlatives} />
</section>
```

### Success Criteria:

#### Automated Verification:
- [x] Component/unit test for trend data transform (moving average) covering short-series edge cases.
- [x] `npm run lint` passes.
- [ ] `npm run test` passes (including new tests).

#### Manual Verification:
- [ ] Charts render three lines (one per GPU) with the toggle switching between 7d/30d.
- [ ] Provider coverage shown in tooltip or legend; no layout shift/flicker when toggling.
- [ ] Mobile view keeps charts readable and fits under Top Picks.

**Implementation Note**: After this phase, confirm data freshness by comparing chart last-day value with the Top Picks tile price for the same GPU.

---

## Testing Strategy
- Unit: moving-average helper (short windows, missing days), API helper response shaping, Superlatives-to-Trends prop mapping.
- Integration/UI: RTL test to assert charts render loading/empty states and respond to toggle; mock API responses.
- Manual: Verify charts update when Top Picks change (e.g., changing data set), and tooltip shows provider count.

## Performance Considerations
- Server-side aggregation minimizes payload (<31 rows per GPU) and avoids the 1000-row cap.
- Use Next fetch caching/ISR on the API route to avoid redundant Supabase calls; client revalidation can be lightweight.
- Keep chart library lean (recharts) and avoid heavy bundles; lazy-load charts if needed.

## Migration Notes
- New Supabase migration for the trend RPC. No existing table changes.

## References
- Research: `docs/research/2025-12-01-price-trend-top-picks.md`
- Schema & RPC: `supabase/migrations/00001_initial_schema.sql:63-155`
- Top Picks UI: `components/Superlatives.jsx:6-142`
- Homepage slot: `app/page.js:83-101`
