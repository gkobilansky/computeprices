---
date: 2025-12-22T18:46:50Z
researcher: Gene
git_commit: da2540e506268c5e0c9bfd44222cc5a6462828fb
branch: main
repository: computeprices
topic: "Codebase Architecture for Adding Inference API Providers"
tags: [research, codebase, inference-api, llm-pricing, providers, database-schema]
status: complete
last_updated: 2025-12-22
last_updated_by: Gene
---

# Research: Codebase Architecture for Adding Inference API Providers

**Date**: 2025-12-22T18:46:50Z
**Researcher**: Gene
**Git Commit**: da2540e506268c5e0c9bfd44222cc5a6462828fb
**Branch**: main
**Repository**: computeprices

## Research Question

What does the current codebase architecture look like for supporting Inference API providers (pay-per-token models like Fireworks AI, Together AI, DeepInfra, Groq, OpenAI, Anthropic)?

## Summary

The ComputePrices codebase is currently architected around **GPU compute pricing** with an hourly rate model. The system tracks cloud providers offering GPU instances, scrapes/fetches their pricing data, and displays comparison tables. Key architectural elements:

- **Database**: GPU-centric schema with `gpu_models`, `providers`, and `prices` tables
- **Pricing Model**: Hourly rates (`price_per_hour`) for GPU instances
- **Provider System**: No explicit "type" field - all providers are implicitly GPU compute providers
- **Scrapers**: Extract GPU model names and hourly prices from provider pricing pages
- **UI**: Displays price-per-hour comparisons for GPU instances

To support Inference API providers, the architecture would need expansion since token-based pricing is fundamentally different from hourly GPU pricing.

## Reference Site Analysis

### GetDeploying LLM Price Comparison
URL: https://getdeploying.com/llm-price-comparison

**Data Model**:
| Field | Description |
|-------|-------------|
| Model | LLM identifier (e.g., claude-3.5-sonnet, gpt-4o) |
| Provider | API provider offering the model |
| Knowledge Cutoff | Date after which model lacks knowledge |
| Modalities | Input types: text, image, video, audio |
| Context | Maximum input tokens (e.g., 128K, 1M) |
| Price/1M | Cost per 1M tokens (input \| output format) |

**Pricing Format**: `$0.04 | $0.15` = $0.04 per 1M input tokens, $0.15 per 1M output tokens

### Artificial Analysis Provider Leaderboard
URL: https://artificialanalysis.ai/leaderboards/providers

**Extended Data Model**:
- Performance benchmarks: AIME25, GPQA, HLE, MMLU Pro, LiveCodeBench
- Composite indexes: Intelligence Index, Math Index, Coding Index, Agentic Index
- Pricing metrics: Input/output per 1M tokens, blended 3:1 pricing, cache pricing
- Model capabilities: Context window, modalities, reasoning tokens, parameter counts
- Metadata: Release dates, deprecation status, function calling support, JSON mode

## Detailed Findings

### 1. Current Database Schema

#### Core Tables

**`providers` table** (`supabase/migrations/00001_initial_schema.sql:4-11`)
```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pricing_page TEXT,  -- Used by Firecrawl scraper
    slug TEXT
);
```

**Key Observation**: No `type` or `category` column exists. All providers are implicitly GPU compute providers.

**`gpu_models` table** (`supabase/migrations/00001_initial_schema.sql:21-61`)
- Primary entity being priced
- Contains hardware specs: VRAM, CUDA cores, tensor cores, memory bandwidth
- Performance metrics: FP16/FP32/FP64 TFLOPS, MLPerf scores
- Market data: MSRP, performance tier, release date

**`prices` table** (`supabase/migrations/00001_initial_schema.sql:64-73`)
```sql
CREATE TABLE prices (
    id UUID PRIMARY KEY,
    provider_id UUID REFERENCES providers(id),
    gpu_model_id UUID REFERENCES gpu_models(id),
    price_per_hour DECIMAL(10,4) NOT NULL,
    gpu_count NUMERIC DEFAULT 1,
    source_name TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Key Observation**: Pricing is strictly hourly (`price_per_hour`). No support for token-based pricing.

#### Relationships
```
providers (1) ──────> (N) prices (N) <────── (1) gpu_models
```

The current schema creates a many-to-many relationship between providers and GPU models through the prices table.

### 2. Provider Architecture

#### No Explicit Type System
The codebase has no `provider_type` field. Instead, providers are implicitly categorized by their data integration method:

| Category | Description | Examples |
|----------|-------------|----------|
| JSON-Based | Full metadata in `data/providers.json` | AWS, CoreWeave |
| Database-Only | DB record, minimal metadata, `isMinimal: true` flag | Various |
| API-Based | Dedicated API integrations | Lambda, Shadeform, RunPod |
| Shadeform Sub-Providers | Mapped via `data/shadeformProviders.json` | 22 cloud providers |

**Provider Data Sources**:
- `data/providers.json`: Extended metadata (features, pros/cons, services)
- `providers` table: Core records (id, name, slug, website, pricing_page)
- Hybrid lookup in `lib/providers.ts` prioritizes JSON, falls back to database

#### Provider Interface (`types/comparison.ts:4-22`)
```typescript
interface Provider {
  id: string
  name: string
  slug: string
  description?: string
  link?: string
  docsLink?: string
  features?: ProviderFeature[]
  pros?: string[]
  cons?: string[]
  gettingStarted?: GettingStartedStep[]
  computeServices?: ComputeService[]
  gpuServices?: GPUService[]
  pricingOptions?: PricingOption[]
  regions?: string
  isMinimal?: boolean
}
```

### 3. Scraper/Cron Architecture

#### Structure
Each provider has a dedicated route at `/app/api/cron/[provider-slug]/route.ts`

**Three Scraping Methods**:
1. **Puppeteer Web Scraping**: Browser automation for HTML parsing (AWS, CoreWeave, FluidStack, Hyperstack)
2. **REST/GraphQL API**: Direct API integration (Lambda, Shadeform, RunPod, DataCrunch)
3. **Firecrawl AI**: Universal AI-powered extraction with auto-rotation (`/app/api/cron/firecrawl/route.ts`)

#### Common Scraper Flow
1. Fetch data from source (API or web page)
2. Query `gpu_models` table for matching
3. Call `findMatchingGPUModel(gpuName, existingModels)` for each extracted GPU
4. Insert matched prices into `prices` table
5. Return success/failure with match statistics

#### GPU Matching Utilities (`lib/utils/gpu-scraping.js`)
- `extractGPUModel(gpuName)`: Normalizes GPU names (handles H100, A100, B200, etc.)
- `findMatchingGPUModel()`: Fuzzy matching against database
- `normalizeGPUName()`: Removes memory sizes, form factors, PCIe references

#### Firecrawl Schema (`lib/utils/firecrawl.ts:8-43`)
```typescript
const GPU_PRICING_SCHEMA = {
  type: 'object',
  properties: {
    gpus: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          gpu_name: { type: 'string' },      // Required
          price_per_hour: { type: 'number' }, // Required
          gpu_count: { type: 'integer' },
          vram_gb: { type: 'integer' },
          instance_type: { type: 'string' }
        }
      }
    }
  }
}
```

### 4. UI Components

#### Main Price Display Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `GPUComparisonTable` | `/components/GPUComparisonTable.jsx` | Main homepage comparison |
| `GPUComparisonTableClient` | `/components/GPUComparisonTableClient.jsx` | Client-side filtering/sorting |
| `GPUPricingTable` | `/components/GPUPricingTable.jsx` | Single GPU, all providers |
| `ProviderGPUTable` | `/components/ProviderGPUTable.jsx` | Single provider, all GPUs |
| `ComparisonPricingTable` | `/components/comparison/ComparisonPricingTable.jsx` | Two-provider comparison |

#### Data Flow
1. **Server-side**: Page components call `fetchGPUPrices()` via Supabase RPC
2. **Client-side**: `FilterContext` manages filters (provider, GPU, budget, use case)
3. **Display**: Tables show `price_per_hour` formatted as `$X.XX/hr`

#### Price Formatting
All prices formatted via `formatPrice()` utility as `$X.XX/hr`

#### Filter Context (`lib/context/FilterContext.js`)
- Provider selection
- GPU selection
- Budget range
- Use case filter
- "Best price only" toggle

### 5. Data Fetching Functions (`lib/utils/fetchGPUData.js`)

| Function | Purpose |
|----------|---------|
| `fetchGPUModels(gpuId)` | Get GPU information |
| `fetchGPUPrices({selectedProvider, selectedGPU})` | Get latest prices via RPC |
| `fetchProviders()` | Get all providers |
| `fetchProviderComparison(p1, p2)` | Side-by-side comparison data |
| `getHomepageStats()` | Counts for hero section |
| `getProviderSuggestions(providerId)` | Find comparable providers |

#### Stored Procedure: `get_latest_prices`
```sql
SELECT DISTINCT ON (p.provider_id, p.gpu_model_id)
    p.id, p.provider_id, prov.name, prov.slug,
    p.gpu_model_id, gm.name, gm.vram,
    p.price_per_hour, p.gpu_count, ...
FROM prices p
JOIN providers prov ON p.provider_id = prov.id
JOIN gpu_models gm ON p.gpu_model_id = gm.id
ORDER BY provider_id, gpu_model_id, created_at DESC
```

## Architecture Comparison: GPU vs Inference API

| Aspect | Current (GPU Compute) | Needed (Inference API) |
|--------|----------------------|------------------------|
| **Entity** | GPU Model (H100, A100, etc.) | LLM Model (GPT-4, Claude, etc.) |
| **Pricing Unit** | Per hour | Per token (or per 1M tokens) |
| **Price Fields** | `price_per_hour` | `price_per_1m_input`, `price_per_1m_output` |
| **Model Attributes** | VRAM, CUDA cores, TFLOPs | Context window, modalities, knowledge cutoff |
| **Provider Type** | Cloud GPU provider | API provider (some overlap: DeepInfra, RunPod) |
| **Scraping Target** | GPU instance pricing tables | API pricing pages |

## Code References

### Database Schema
- `supabase/migrations/00001_initial_schema.sql` - Core tables
- `supabase/migrations/00002_alter_gpu_tables.sql` - GPU details, indexes
- `supabase/migrations/20251203133000_align_with_prod_schema.sql` - Stored procedures

### Provider System
- `lib/providers.ts` - Provider lookup, caching, validation
- `data/providers.json` - Extended provider metadata
- `types/comparison.ts` - TypeScript interfaces

### Scrapers
- `app/api/cron/firecrawl/route.ts` - Universal AI scraper
- `app/api/cron/lambda/route.ts` - API integration example
- `app/api/cron/aws/route.ts` - Puppeteer scraping example
- `lib/utils/gpu-scraping.js` - GPU matching utilities
- `lib/utils/firecrawl.ts` - Firecrawl client and schema
- `lib/utils/puppeteer-config.ts` - Browser configuration

### UI Components
- `components/GPUComparisonTableClient.jsx` - Main price table
- `components/GPUPricingTable.jsx` - Single GPU pricing
- `components/ProviderGPUTable.jsx` - Single provider pricing
- `lib/utils/fetchGPUData.js` - Data fetching functions
- `lib/context/FilterContext.js` - Filter state management

### Pages
- `app/page.js` - Homepage
- `app/gpus/[slug]/page.js` - GPU detail
- `app/providers/[slug]/page.js` - Provider detail
- `app/compare/[...providers]/page.tsx` - Provider comparison

## Architecture Documentation

### Current Patterns

1. **Hybrid Data Storage**: Database for core records, JSON for extended metadata
2. **Server/Client Split**: Server components fetch initial data, client components handle interactivity
3. **Universal Scraper**: Firecrawl with auto-rotation and fallback to dedicated scrapers
4. **Caching Strategy**: 5-minute in-memory cache for provider lookups, 1-6 hour ISR for pages
5. **Modular Scrapers**: Each provider has isolated route, shared utilities for matching

### Providers with Dual Offerings
Some providers offer BOTH GPU compute AND inference APIs:
- **DeepInfra**: GPU instances + LLM API
- **RunPod**: GPU instances + Serverless inference
- **Together AI**: GPU clusters + LLM API
- **Lambda Labs**: GPU cloud + (potentially) inference

These would appear in both sections with proper provider typing.

## Open Questions

1. **Schema Extension vs New Tables**: Should LLM models be added to `gpu_models` table or a new `llm_models` table?
2. **Provider Typing**: Add a `type` enum to providers table, or use a junction table for multi-type providers?
3. **Pricing Table Structure**: Single `prices` table with nullable columns, or separate `llm_prices` table?
4. **UI Integration**: Separate pages for LLM pricing, or integrated with tabs/filters?
5. **Scraper Reuse**: Can Firecrawl schema be extended for LLM pricing extraction?
