# Inference Providers V1 Implementation Plan

## Overview

Expand ComputePrices to properly support LLM inference API pricing alongside GPU compute pricing. This involves restructuring the site to have a landing homepage with separate /gpu and /inference pages, enhancing the LLM model schema, and adding 5 new inference providers.

## Current State Analysis

The latest commit (131fb78) added initial inference support:
- Database: `llm_models` and `llm_prices` tables with `provider_type` enum
- UI: `/inference` page with `LLMComparisonTable` component
- Data: 23 models, 39 prices across 5 providers (OpenAI, Anthropic, Together AI, Fireworks AI, DeepInfra)
- Provider pages conditionally show LLM pricing based on provider type

### Key Discoveries:
- Homepage (`app/page.js:24-168`) is tightly coupled to GPU pricing
- **Main branch uses `data/providers/*.json`** (individual files per provider) - NOT `data/providers.json`
- Jest + React Testing Library is configured but no tests written yet
- Current seed data is missing latest flagship models (GPT-5.2, Claude Opus 4.5, Gemini 3)

## Desired End State

1. **Homepage** (`/`): Landing page with combined stats and equal-prominence CTAs to /gpu and /inference
2. **GPU Page** (`/gpu`): Current homepage GPU comparison moved here
3. **Inference Page** (`/inference`): Enhanced LLM pricing with modalities/knowledge cutoff
4. **Schema**: `llm_models` extended with `modalities` (TEXT[]) and `knowledge_cutoff` (DATE)
5. **Providers**: 5 new inference providers (Groq, Replicate, Azure, Bedrock, Vertex AI)
6. **Models**: Updated with latest flagship models (GPT-5.2, Claude 4.5 series, Gemini 3)
7. **Tests**: Basic component tests for new pages

## What We're NOT Doing

- Automated scrapers for LLM pricing (v2)
- Batch/cached pricing columns (v2)
- Performance benchmarks (v2)
- LLM model detail pages (v2)

---

## Phase 0: Merge Main Branch Changes

### Overview
Sync with main branch to get the new provider structure (`data/providers/*.json`).

```bash
git fetch origin main
git merge origin/main
```

Resolve conflicts, particularly around provider data structures.

### Success Criteria:
- [ ] Merge completes
- [ ] `npm run build` passes

---

## Phase 1: Schema Enhancement

### Overview
Add modalities and knowledge_cutoff columns to llm_models table.

### Changes Required:

#### 1. Database Migration
**File**: `supabase/migrations/20260114000000_enhance_llm_models.sql`

```sql
ALTER TABLE llm_models
ADD COLUMN IF NOT EXISTS modalities TEXT[] DEFAULT '{"text"}';

ALTER TABLE llm_models
ADD COLUMN IF NOT EXISTS knowledge_cutoff DATE;

CREATE INDEX IF NOT EXISTS idx_llm_models_modalities ON llm_models USING GIN(modalities);
```

#### 2. Update Stored Procedure
**File**: `supabase/migrations/20260114000001_update_llm_prices_rpc.sql`

Update `get_latest_llm_prices` to return `modalities` and `knowledge_cutoff`.

#### 3. Add Latest Models + Update Existing
**File**: `scripts/seed-latest-llm-models.js`

**NEW FLAGSHIP MODELS (2025-2026):**

| Model | Creator | Context | Modalities | Knowledge Cutoff |
|-------|---------|---------|------------|------------------|
| GPT-5.2 | OpenAI | 400K | text, image | 2025-06-01 |
| GPT-5.1 | OpenAI | 256K | text, image | 2025-03-01 |
| GPT-5 | OpenAI | 200K | text, image | 2024-12-01 |
| Claude Opus 4.5 | Anthropic | 200K | text, image | 2025-04-01 |
| Claude Sonnet 4.5 | Anthropic | 200K | text, image | 2025-04-01 |
| Claude Haiku 4.5 | Anthropic | 200K | text, image | 2025-04-01 |
| Gemini 3 Pro | Google | 1M | text, image, video, audio | 2025-06-01 |
| Gemini 3 Flash | Google | 1M | text, image, video, audio | 2025-06-01 |

**EXISTING MODELS TO UPDATE:**

| Model | Modalities | Knowledge Cutoff |
|-------|------------|------------------|
| gpt-4o | text, image | 2023-10-01 |
| gpt-4o-mini | text, image | 2023-10-01 |
| claude-3-5-sonnet | text, image | 2024-04-01 |
| claude-3-5-haiku | text, image | 2024-04-01 |
| claude-3-opus | text, image | 2023-08-01 |
| llama-3-3-70b | text | 2024-03-01 |
| deepseek-r1 | text | 2024-11-01 |
| deepseek-v3 | text | 2024-06-01 |
| mistral-large | text | 2024-01-01 |
| qwen-2-5-72b | text | 2024-03-01 |

### Success Criteria:
- [ ] Migration applies cleanly
- [ ] New models in database
- [ ] Existing models have modalities/knowledge_cutoff populated

---

## Phase 2: Add New Inference Providers

### Overview
Add Groq, Replicate, Azure OpenAI, AWS Bedrock, and Google Vertex AI.

### Changes Required:

#### 1. Database Migration
**File**: `supabase/migrations/20260114000002_add_inference_providers.sql`

```sql
INSERT INTO providers (name, slug, website, type, pricing_page) VALUES
  ('Groq', 'groq', 'https://groq.com', 'inference_api', 'https://groq.com/pricing'),
  ('Replicate', 'replicate', 'https://replicate.com', 'inference_api', 'https://replicate.com/pricing'),
  ('Azure OpenAI', 'azure-openai', 'https://azure.microsoft.com/en-us/products/ai-services/openai-service', 'inference_api', 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/'),
  ('AWS Bedrock', 'aws-bedrock', 'https://aws.amazon.com/bedrock', 'inference_api', 'https://aws.amazon.com/bedrock/pricing/'),
  ('Google Vertex AI', 'vertex-ai', 'https://cloud.google.com/vertex-ai', 'inference_api', 'https://cloud.google.com/vertex-ai/generative-ai/pricing')
ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type, pricing_page = EXCLUDED.pricing_page;
```

#### 2. Create Provider JSON Files
**Directory**: `data/providers/`

Create: `groq.json`, `replicate.json`, `azure-openai.json`, `aws-bedrock.json`, `vertex-ai.json`

#### 3. Seed Provider Prices
**File**: `scripts/seed-latest-llm-prices.js`

**CURRENT PRICING (January 2026):**

| Provider | Model | Input/1M | Output/1M |
|----------|-------|----------|-----------|
| **OpenAI** | GPT-5.2 | $1.75 | $14.00 |
| OpenAI | GPT-5.1 | $1.50 | $12.00 |
| OpenAI | GPT-5 | $1.25 | $10.00 |
| OpenAI | GPT-4o | $2.50 | $10.00 |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 |
| **Anthropic** | Claude Opus 4.5 | $5.00 | $25.00 |
| Anthropic | Claude Sonnet 4.5 | $3.00 | $15.00 |
| Anthropic | Claude Haiku 4.5 | $1.00 | $5.00 |
| Anthropic | Claude 3.5 Sonnet | $3.00 | $15.00 |
| **Vertex AI** | Gemini 3 Pro | $2.00 | $12.00 |
| Vertex AI | Gemini 3 Flash | $0.50 | $3.00 |
| Vertex AI | Gemini 2.0 Flash | $0.10 | $0.40 |
| **Azure OpenAI** | GPT-5.2 | $1.75 | $14.00 |
| Azure OpenAI | GPT-4o | $2.50 | $10.00 |
| **AWS Bedrock** | Claude Opus 4.5 | $5.00 | $25.00 |
| AWS Bedrock | Claude Sonnet 4.5 | $3.00 | $15.00 |
| AWS Bedrock | Llama 3.3 70B | $0.99 | $0.99 |
| **Groq** | Llama 3.3 70B | $0.59 | $0.79 |
| Groq | Llama 3.1 8B | $0.05 | $0.08 |
| Groq | Mixtral 8x7B | $0.24 | $0.24 |
| **Replicate** | Llama 3.1 405B | $9.50 | $9.50 |
| Replicate | Llama 3.1 70B | $0.65 | $0.65 |
| **Together AI** | Llama 3.3 70B | $0.88 | $0.88 |
| Together AI | DeepSeek R1 | $3.00 | $7.00 |
| **DeepInfra** | Llama 3.3 70B | $0.35 | $0.40 |
| DeepInfra | DeepSeek R1 | $0.55 | $2.19 |
| **Fireworks** | Llama 3.3 70B | $0.90 | $0.90 |
| Fireworks | DeepSeek R1 | $3.00 | $8.00 |

### Success Criteria:
- [ ] 10 inference providers in database
- [ ] Latest model prices seeded
- [ ] Provider pages load correctly

---

## Phase 3: Create /gpu Page

### Overview
Move GPU comparison from homepage to `/gpu`.

### Changes Required:

#### 1. Create Page
**File**: `app/gpu/page.js`

- Import existing components: `GPUComparisonTable`, `IntegratedFilters`, `TopPicksSection`, `FilterProvider`
- Metadata: "Cloud GPU Pricing Comparison | ComputePrices"
- Same layout as current homepage

#### 2. Create Test
**File**: `__tests__/gpu-page.test.jsx`

Test page renders with title, filters, table.

### Success Criteria:
- [ ] `/gpu` returns 200
- [ ] All existing functionality works
- [ ] Tests pass

---

## Phase 4: Redesign Homepage as Landing Page

### Overview
Transform homepage into landing with stats and CTAs.

### Changes Required:

#### 1. Create Components

**`components/landing/LandingHero.jsx`**
- "Compare Cloud AI Pricing"
- Stats grid: GPU providers, GPU models, LLM providers, LLM models

**`components/landing/LandingCTAs.jsx`**
- GPU card (blue) → /gpu
- LLM card (purple) → /inference

**`components/landing/LandingCharts.jsx`**
- Price range visualizations for top GPUs and LLMs

#### 2. Rewrite Homepage
**File**: `app/page.js`

Remove GPU-specific components, add landing components.

#### 3. Update Navigation
**File**: `components/Nav.jsx`

```javascript
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/gpu', label: 'GPU Pricing' },
  { href: '/inference', label: 'LLM Pricing' },
  { href: '/providers', label: 'Providers' },
  { href: '/gpus', label: 'GPUs' },
  { href: '/learn', label: 'Learn' },
  { href: '/blog', label: 'Blog' }
];
```

#### 4. Create Tests
**File**: `__tests__/landing-page.test.jsx`

Test stats render, CTAs link correctly.

### Success Criteria:
- [ ] Homepage shows combined stats
- [ ] CTAs navigate correctly
- [ ] Tests pass

---

## Phase 5: Enhance /inference Page

### Overview
Add modalities and knowledge cutoff to LLM comparison table.

### Changes Required:

#### 1. Update LLMComparisonTable
**File**: `components/LLMComparisonTable.jsx`

- Add columns: Modalities (icons), Knowledge Cutoff (date)
- Add modality filter dropdown
- Helper functions for formatting

#### 2. Create Tests
**File**: `__tests__/llm-comparison-table.test.jsx`

Test modality icons, filters, sorting.

### Success Criteria:
- [ ] New columns display
- [ ] Modality filter works
- [ ] Tests pass

---

## Phase 6: Final Testing & Cleanup

### Automated Tests:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes

### Manual Testing:
- [ ] Home → GPU Pricing works
- [ ] Home → LLM Pricing works
- [ ] All 10 inference providers visible
- [ ] Latest models (GPT-5.2, Claude 4.5, Gemini 3) display
- [ ] DeepInfra shows both GPU and LLM pricing
- [ ] Mobile responsive

---

## Testing Strategy

### Automated (Jest + React Testing Library):
1. `__tests__/landing-page.test.jsx` - Stats, CTAs
2. `__tests__/gpu-page.test.jsx` - Title, filters, table
3. `__tests__/llm-comparison-table.test.jsx` - Modalities, filters, sorting

### Manual Testing Steps:
1. Navigate homepage → verify stats and CTAs
2. Click GPU CTA → verify table and filters
3. Click LLM CTA → verify new columns and modality filter
4. Check provider pages for Groq, Vertex AI, etc.
5. Test on mobile

---

## Migration Notes

- Homepage URL `/` changes from GPU table to landing
- Add `/gpu` to sitemap
- Consider redirect `/?gpu` → `/gpu`

## References

- Research: `thoughts/shared/research/2025-12-22-inference-api-provider-research.md`
- Provider structure: `data/providers/*.json` (main branch)
- Pricing sources:
  - OpenAI: https://platform.openai.com/docs/pricing
  - Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
  - Google: https://ai.google.dev/gemini-api/docs/pricing
  - getdeploying: https://getdeploying.com/llm-price-comparison
