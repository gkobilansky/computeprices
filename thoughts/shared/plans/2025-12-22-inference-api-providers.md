# Inference API Providers Implementation Plan

## Overview

Add support for inference API providers (pay-per-token LLM services) to ComputePrices. This creates a new vertical alongside GPU compute pricing, starting with 6 providers: DeepInfra, Hyperstack, Together AI, Fireworks AI, OpenAI, and Anthropic.

## Current State Analysis

The codebase is architected around **GPU compute pricing** with an hourly rate model:
- Database: `gpu_models`, `providers`, `prices` tables
- Pricing: `price_per_hour` for GPU instances
- No provider type distinction - all providers are implicitly GPU compute

### Key Discoveries:
- DeepInfra and Hyperstack already exist as GPU providers (`lib/providers.ts`, `data/providers.json`)
- Provider system supports hybrid data: JSON for extended metadata, DB for core records
- Firecrawl scraper architecture can be extended for LLM pricing extraction
- All 6 target providers use per-1M-token pricing with separate input/output rates

## Desired End State

After implementation:
1. New `/inference` section displays LLM model pricing across providers
2. Database has `llm_models` and `llm_prices` tables with token-based pricing
3. Providers table has `type` field to distinguish GPU compute vs inference API providers
4. DeepInfra and Hyperstack show in both GPU compute AND inference sections
5. Manual price entry workflow exists for initial data population

### Verification:
- `/inference` page loads and displays pricing table
- Database contains LLM models and prices for all 6 providers
- Existing GPU compute functionality unchanged
- Provider pages show appropriate sections based on provider type

## What We're NOT Doing

- Building automated scrapers (manual entry first)
- Adding advanced data points (benchmarks, modalities, knowledge cutoff)
- Batch/cached pricing tiers (start with standard pricing only)
- Provider comparison pages for inference (future enhancement)
- Fine-tuning pricing or other services

---

## Phase 1: Database Schema

### Overview
Create new tables for LLM models and pricing, add provider type field.

### Changes Required:

#### 1. Migration: Add provider type enum and column
**File**: `supabase/migrations/[timestamp]_add_inference_schema.sql`

```sql
-- Add provider type enum
CREATE TYPE provider_type AS ENUM ('gpu_compute', 'inference_api', 'both');

-- Add type column to providers (default to gpu_compute for existing)
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS type provider_type DEFAULT 'gpu_compute';

-- Update existing dual providers
UPDATE providers SET type = 'both' WHERE slug IN ('deep-infra', 'hyperstack');
```

#### 2. Migration: Create llm_models table
**File**: `supabase/migrations/[timestamp]_add_inference_schema.sql` (continued)

```sql
-- Create llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- e.g., "GPT-4o", "Claude 3.5 Sonnet"
    slug TEXT NOT NULL UNIQUE,                   -- e.g., "gpt-4o", "claude-3-5-sonnet"
    creator TEXT NOT NULL,                       -- e.g., "OpenAI", "Anthropic", "Meta"
    context_window INTEGER,                      -- Max tokens (e.g., 128000, 200000)
    description TEXT,                            -- Brief description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llm_models_slug ON llm_models(slug);
CREATE INDEX IF NOT EXISTS idx_llm_models_creator ON llm_models(creator);
```

#### 3. Migration: Create llm_prices table
**File**: `supabase/migrations/[timestamp]_add_inference_schema.sql` (continued)

```sql
-- Create llm_prices table
CREATE TABLE IF NOT EXISTS llm_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    llm_model_id UUID NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
    price_per_1m_input DECIMAL(10,4) NOT NULL,   -- Price per 1M input tokens
    price_per_1m_output DECIMAL(10,4) NOT NULL,  -- Price per 1M output tokens
    source_url TEXT,                              -- Where price was found
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llm_prices_provider_id ON llm_prices(provider_id);
CREATE INDEX IF NOT EXISTS idx_llm_prices_llm_model_id ON llm_prices(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_llm_prices_created_at ON llm_prices(created_at);

-- Enable RLS
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_prices ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to llm_models"
    ON llm_models FOR SELECT USING (true);

CREATE POLICY "Allow public read access to llm_prices"
    ON llm_prices FOR SELECT USING (true);
```

#### 4. Migration: Create stored procedure for latest LLM prices
**File**: `supabase/migrations/[timestamp]_add_inference_schema.sql` (continued)

```sql
-- Stored procedure for latest LLM prices
CREATE OR REPLACE FUNCTION get_latest_llm_prices(
    selected_provider UUID DEFAULT NULL,
    selected_model UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    provider_id UUID,
    provider_name TEXT,
    provider_slug TEXT,
    llm_model_id UUID,
    model_name TEXT,
    model_slug TEXT,
    creator TEXT,
    context_window INTEGER,
    price_per_1m_input DECIMAL,
    price_per_1m_output DECIMAL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (lp.provider_id, lp.llm_model_id)
        lp.id,
        lp.provider_id,
        p.name as provider_name,
        p.slug as provider_slug,
        lp.llm_model_id,
        lm.name as model_name,
        lm.slug as model_slug,
        lm.creator,
        lm.context_window,
        lp.price_per_1m_input,
        lp.price_per_1m_output,
        lp.source_url,
        lp.created_at
    FROM llm_prices lp
    JOIN providers p ON lp.provider_id = p.id
    JOIN llm_models lm ON lp.llm_model_id = lm.id
    WHERE
        (selected_provider IS NULL OR lp.provider_id = selected_provider)
        AND (selected_model IS NULL OR lp.llm_model_id = selected_model)
    ORDER BY lp.provider_id, lp.llm_model_id, lp.created_at DESC;
END;
$$;
```

### Success Criteria:

#### Automated Verification:
- [x] Migration applies cleanly: `npx supabase db push` or apply to Supabase dashboard
- [x] Tables exist: Query `llm_models` and `llm_prices` tables
- [x] Provider type column exists: `SELECT type FROM providers LIMIT 1`
- [x] Stored procedure works: `SELECT * FROM get_latest_llm_prices()`

#### Manual Verification:
- [ ] Verify in Supabase dashboard that tables and columns are correct
- [ ] Confirm existing GPU data is unaffected

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Add New Providers to Database

### Overview
Add the 4 new inference-only providers to the providers table and providers.json.

### Changes Required:

#### 1. Database: Insert new providers
Run via Supabase SQL editor or migration:

```sql
-- Insert new inference-only providers
INSERT INTO providers (name, slug, website, pricing_page, type) VALUES
('Together AI', 'together-ai', 'https://www.together.ai', 'https://www.together.ai/pricing', 'inference_api'),
('Fireworks AI', 'fireworks-ai', 'https://fireworks.ai', 'https://fireworks.ai/pricing', 'inference_api'),
('OpenAI', 'openai', 'https://openai.com', 'https://openai.com/api/pricing', 'inference_api'),
('Anthropic', 'anthropic', 'https://www.anthropic.com', 'https://www.anthropic.com/pricing', 'inference_api')
ON CONFLICT (name) DO UPDATE SET
    type = EXCLUDED.type,
    pricing_page = EXCLUDED.pricing_page;
```

#### 2. providers.json: Add minimal entries for new providers
**File**: `data/providers.json`

Add entries for Together AI, Fireworks AI, OpenAI, Anthropic with structure matching existing providers:

```json
{
  "name": "OpenAI",
  "slug": "openai",
  "description": "OpenAI provides API access to GPT-4o, GPT-4, and other frontier models with pay-per-token pricing.",
  "link": "https://openai.com",
  "docsLink": "https://platform.openai.com/docs",
  "features": [
    {
      "title": "GPT-4o and GPT-4 Models",
      "description": "Access to frontier language models including GPT-4o, GPT-4o mini, and reasoning models"
    },
    {
      "title": "OpenAI-Compatible API",
      "description": "Industry-standard API format used by many inference providers"
    }
  ],
  "pros": [
    "Industry-leading model capabilities",
    "Comprehensive documentation and SDKs",
    "Batch API offers 50% discount for async workloads"
  ],
  "cons": [
    "Premium pricing compared to open-source alternatives",
    "No open-source model weights"
  ]
}
```

(Similar entries for Anthropic, Together AI, Fireworks AI)

### Success Criteria:

#### Automated Verification:
- [x] Query providers: `SELECT name, slug, type FROM providers WHERE type IN ('inference_api', 'both')`
- [x] Returns 6 providers (DeepInfra, Hyperstack, Together AI, Fireworks AI, OpenAI, Anthropic)

#### Manual Verification:
- [ ] Verify provider entries look correct in Supabase dashboard
- [x] JSON syntax is valid: `node -e "require('./data/providers.json')"`

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Seed LLM Models and Initial Prices

### Overview
Create a script to seed LLM models and manually enter initial pricing data.

### Changes Required:

#### 1. Create seed script for LLM models
**File**: `scripts/seed-llm-models.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const llmModels = [
  // OpenAI
  { name: 'GPT-4o', slug: 'gpt-4o', creator: 'OpenAI', context_window: 128000 },
  { name: 'GPT-4o mini', slug: 'gpt-4o-mini', creator: 'OpenAI', context_window: 128000 },
  { name: 'GPT-4.1', slug: 'gpt-4-1', creator: 'OpenAI', context_window: 1000000 },

  // Anthropic
  { name: 'Claude Opus 4.5', slug: 'claude-opus-4-5', creator: 'Anthropic', context_window: 200000 },
  { name: 'Claude Sonnet 4.5', slug: 'claude-sonnet-4-5', creator: 'Anthropic', context_window: 200000 },
  { name: 'Claude Haiku 4.5', slug: 'claude-haiku-4-5', creator: 'Anthropic', context_window: 200000 },

  // Meta (offered by Together, Fireworks, DeepInfra)
  { name: 'Llama 3.3 70B', slug: 'llama-3-3-70b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 405B', slug: 'llama-3-1-405b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 70B', slug: 'llama-3-1-70b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 8B', slug: 'llama-3-1-8b', creator: 'Meta', context_window: 128000 },

  // DeepSeek (offered by multiple providers)
  { name: 'DeepSeek V3', slug: 'deepseek-v3', creator: 'DeepSeek', context_window: 64000 },
  { name: 'DeepSeek R1', slug: 'deepseek-r1', creator: 'DeepSeek', context_window: 64000 },

  // Mistral (offered by multiple providers)
  { name: 'Mistral Large', slug: 'mistral-large', creator: 'Mistral', context_window: 128000 },
  { name: 'Mixtral 8x7B', slug: 'mixtral-8x7b', creator: 'Mistral', context_window: 32000 },
];

async function seedModels() {
  console.log('Seeding LLM models...');

  for (const model of llmModels) {
    const { data, error } = await supabase
      .from('llm_models')
      .upsert(model, { onConflict: 'slug' });

    if (error) {
      console.error(`Error inserting ${model.name}:`, error.message);
    } else {
      console.log(`Inserted/updated: ${model.name}`);
    }
  }

  console.log('Done seeding LLM models');
}

seedModels();
```

#### 2. Create manual price entry script
**File**: `scripts/add-llm-price.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addLLMPrice(providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl) {
  // Get provider ID
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('slug', providerSlug)
    .single();

  if (!provider) {
    console.error(`Provider not found: ${providerSlug}`);
    return;
  }

  // Get model ID
  const { data: model } = await supabase
    .from('llm_models')
    .select('id')
    .eq('slug', modelSlug)
    .single();

  if (!model) {
    console.error(`Model not found: ${modelSlug}`);
    return;
  }

  // Insert price
  const { error } = await supabase
    .from('llm_prices')
    .insert({
      provider_id: provider.id,
      llm_model_id: model.id,
      price_per_1m_input: inputPrice,
      price_per_1m_output: outputPrice,
      source_url: sourceUrl
    });

  if (error) {
    console.error(`Error inserting price:`, error.message);
  } else {
    console.log(`Added price: ${providerSlug} / ${modelSlug} - $${inputPrice}/$${outputPrice} per 1M tokens`);
  }
}

// Usage: node scripts/add-llm-price.js <provider-slug> <model-slug> <input-price> <output-price> <source-url>
const [,, providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl] = process.argv;

if (!providerSlug || !modelSlug || !inputPrice || !outputPrice) {
  console.log('Usage: node scripts/add-llm-price.js <provider-slug> <model-slug> <input-price> <output-price> [source-url]');
  console.log('Example: node scripts/add-llm-price.js openai gpt-4o 2.50 10.00 https://openai.com/api/pricing');
  process.exit(1);
}

addLLMPrice(providerSlug, modelSlug, parseFloat(inputPrice), parseFloat(outputPrice), sourceUrl || null);
```

#### 3. Seed initial pricing data
Create a batch script or run commands for initial prices:

```bash
# OpenAI
node scripts/add-llm-price.js openai gpt-4o 2.50 10.00 https://openai.com/api/pricing
node scripts/add-llm-price.js openai gpt-4o-mini 0.15 0.60 https://openai.com/api/pricing

# Anthropic
node scripts/add-llm-price.js anthropic claude-opus-4-5 5.00 25.00 https://www.anthropic.com/pricing
node scripts/add-llm-price.js anthropic claude-sonnet-4-5 3.00 15.00 https://www.anthropic.com/pricing
node scripts/add-llm-price.js anthropic claude-haiku-4-5 1.00 5.00 https://www.anthropic.com/pricing

# Together AI
node scripts/add-llm-price.js together-ai llama-3-3-70b 0.88 0.88 https://www.together.ai/pricing
node scripts/add-llm-price.js together-ai deepseek-v3 1.25 1.25 https://www.together.ai/pricing

# Fireworks AI
node scripts/add-llm-price.js fireworks-ai deepseek-v3 0.56 1.68 https://fireworks.ai/pricing
node scripts/add-llm-price.js fireworks-ai llama-3-1-70b 0.90 0.90 https://fireworks.ai/pricing

# DeepInfra
node scripts/add-llm-price.js deep-infra llama-3-3-70b 0.35 0.40 https://deepinfra.com/pricing
node scripts/add-llm-price.js deep-infra deepseek-v3 0.50 0.90 https://deepinfra.com/pricing

# Hyperstack (if they offer inference)
node scripts/add-llm-price.js hyperstack llama-3-3-70b 0.80 0.80 https://www.hyperstack.cloud/gpu-pricing
```

### Success Criteria:

#### Automated Verification:
- [x] Seed script runs: `node scripts/seed-llm-models.js`
- [x] Models exist: `SELECT COUNT(*) FROM llm_models` returns > 0
- [x] Price entry works: `node scripts/add-llm-price.js openai gpt-4o 2.50 10.00`
- [x] Prices exist: `SELECT * FROM get_latest_llm_prices()` returns data

#### Manual Verification:
- [ ] Verify models look correct in Supabase dashboard
- [ ] Verify prices match source websites

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding to Phase 4.

---

## Phase 4: Data Fetching Utilities

### Overview
Create utility functions to fetch LLM pricing data, mirroring the existing GPU data fetching patterns.

### Changes Required:

#### 1. Create LLM data fetching utilities
**File**: `lib/utils/fetchLLMData.js`

```javascript
import { supabase } from '../supabase';

/**
 * Fetch all LLM models
 */
export async function fetchLLMModels(modelId = null) {
  let query = supabase.from('llm_models').select('*');

  if (modelId) {
    query = query.eq('id', modelId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching LLM models:', error);
    return [];
  }

  return data;
}

/**
 * Fetch latest LLM prices using stored procedure
 */
export async function fetchLLMPrices({ selectedProvider = null, selectedModel = null } = {}) {
  const { data, error } = await supabase.rpc('get_latest_llm_prices', {
    selected_provider: selectedProvider,
    selected_model: selectedModel
  });

  if (error) {
    console.error('Error fetching LLM prices:', error);
    return [];
  }

  return data;
}

/**
 * Fetch inference providers (type = 'inference_api' or 'both')
 */
export async function fetchInferenceProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .in('type', ['inference_api', 'both'])
    .order('name');

  if (error) {
    console.error('Error fetching inference providers:', error);
    return [];
  }

  return data;
}

/**
 * Get LLM model by slug
 */
export async function getLLMModelBySlug(slug) {
  const { data, error } = await supabase
    .from('llm_models')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching LLM model by slug:', error);
    return null;
  }

  return data;
}

/**
 * Get inference stats for homepage
 */
export async function getInferenceStats() {
  const [modelsResult, providersResult, pricesResult] = await Promise.all([
    supabase.from('llm_models').select('id', { count: 'exact', head: true }),
    supabase.from('providers').select('id', { count: 'exact', head: true }).in('type', ['inference_api', 'both']),
    supabase.from('llm_prices').select('id', { count: 'exact', head: true })
  ]);

  return {
    modelCount: modelsResult.count || 0,
    providerCount: providersResult.count || 0,
    priceCount: pricesResult.count || 0
  };
}
```

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript/lint errors: `npm run lint`
- [x] Functions can be imported: Create a test file that imports and calls them

#### Manual Verification:
- [ ] Test in browser console or Node REPL that functions return expected data

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding to Phase 5.

---

## Phase 5: Basic Inference UI

### Overview
Create the `/inference` page with a pricing comparison table.

### Changes Required:

#### 1. Create inference page
**File**: `app/inference/page.js`

```javascript
import { fetchLLMPrices, fetchLLMModels, fetchInferenceProviders } from '@/lib/utils/fetchLLMData';
import LLMComparisonTable from '@/components/LLMComparisonTable';

export const metadata = {
  title: 'LLM API Pricing Comparison | ComputePrices',
  description: 'Compare inference API pricing across providers including OpenAI, Anthropic, Together AI, Fireworks AI, and more.'
};

export const revalidate = 3600; // Revalidate every hour

export default async function InferencePage() {
  const [prices, models, providers] = await Promise.all([
    fetchLLMPrices(),
    fetchLLMModels(),
    fetchInferenceProviders()
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LLM API Pricing Comparison</h1>
        <p className="text-gray-600">
          Compare pay-per-token pricing across {providers.length} inference API providers
          and {models.length} LLM models.
        </p>
      </div>

      <LLMComparisonTable
        prices={prices}
        models={models}
        providers={providers}
      />
    </main>
  );
}
```

#### 2. Create LLM comparison table component
**File**: `components/LLMComparisonTable.jsx`

```javascript
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

function formatPrice(price) {
  if (price === null || price === undefined) return '-';
  return `$${parseFloat(price).toFixed(2)}`;
}

export default function LLMComparisonTable({ prices, models, providers }) {
  const [sortField, setSortField] = useState('price_per_1m_input');
  const [sortDirection, setSortDirection] = useState('asc');
  const [creatorFilter, setCreatorFilter] = useState('');

  // Get unique creators for filter
  const creators = useMemo(() => {
    const unique = [...new Set(models.map(m => m.creator))];
    return unique.sort();
  }, [models]);

  // Sort and filter prices
  const sortedPrices = useMemo(() => {
    let filtered = [...prices];

    if (creatorFilter) {
      const modelIds = models
        .filter(m => m.creator === creatorFilter)
        .map(m => m.id);
      filtered = filtered.filter(p => modelIds.includes(p.llm_model_id));
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? 999999;
      const bVal = b[sortField] ?? 999999;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [prices, sortField, sortDirection, creatorFilter, models]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Model Creators</option>
          {creators.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-left">Creator</th>
              <th className="px-4 py-2 text-left">Provider</th>
              <th className="px-4 py-2 text-left">Context</th>
              <th
                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('price_per_1m_input')}
              >
                Input/1M {sortField === 'price_per_1m_input' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('price_per_1m_output')}
              >
                Output/1M {sortField === 'price_per_1m_output' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((price) => (
              <tr key={price.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{price.model_name}</td>
                <td className="px-4 py-2 text-gray-600">{price.creator}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/providers/${price.provider_slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {price.provider_name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {price.context_window ? `${(price.context_window / 1000).toFixed(0)}K` : '-'}
                </td>
                <td className="px-4 py-2">{formatPrice(price.price_per_1m_input)}</td>
                <td className="px-4 py-2">{formatPrice(price.price_per_1m_output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedPrices.length === 0 && (
        <p className="text-center text-gray-500 py-8">No pricing data available.</p>
      )}
    </div>
  );
}
```

#### 3. Add navigation link
**File**: `components/Header.jsx` or equivalent navigation component

Add link to `/inference` in the main navigation.

### Success Criteria:

#### Automated Verification:
- [x] No lint errors: `npm run lint`
- [x] Page builds: `npm run build`
- [x] No TypeScript errors: `npx tsc --noEmit`

#### Manual Verification:
- [ ] Navigate to `/inference` and see pricing table
- [ ] Sorting by input/output price works
- [ ] Creator filter works
- [ ] Provider links navigate to correct pages

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding to Phase 6.

---

## Phase 6: Provider Type Integration

### Overview
Update provider pages and listings to show inference pricing where applicable.

### Changes Required:

#### 1. Update provider page to show inference section
**File**: `app/providers/[slug]/page.js`

Add section for providers with `type = 'inference_api'` or `'both'`:

```javascript
// Add to imports
import { fetchLLMPrices } from '@/lib/utils/fetchLLMData';
import LLMPricingTable from '@/components/LLMPricingTable';

// In the page component, fetch LLM prices if provider offers inference
const providerType = provider.type || 'gpu_compute';
const showInference = ['inference_api', 'both'].includes(providerType);

let llmPrices = [];
if (showInference) {
  llmPrices = await fetchLLMPrices({ selectedProvider: provider.id });
}

// In the JSX, add inference section
{showInference && llmPrices.length > 0 && (
  <section className="mt-8">
    <h2 className="text-2xl font-bold mb-4">Inference API Pricing</h2>
    <LLMPricingTable prices={llmPrices} />
  </section>
)}
```

#### 2. Create LLM pricing table for single provider
**File**: `components/LLMPricingTable.jsx`

```javascript
'use client';

function formatPrice(price) {
  if (price === null || price === undefined) return '-';
  return `$${parseFloat(price).toFixed(2)}`;
}

export default function LLMPricingTable({ prices }) {
  const sortedPrices = [...prices].sort((a, b) =>
    a.price_per_1m_input - b.price_per_1m_input
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Model</th>
            <th className="px-4 py-2 text-left">Creator</th>
            <th className="px-4 py-2 text-left">Context</th>
            <th className="px-4 py-2 text-left">Input/1M</th>
            <th className="px-4 py-2 text-left">Output/1M</th>
          </tr>
        </thead>
        <tbody>
          {sortedPrices.map((price) => (
            <tr key={price.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{price.model_name}</td>
              <td className="px-4 py-2 text-gray-600">{price.creator}</td>
              <td className="px-4 py-2 text-gray-600">
                {price.context_window ? `${(price.context_window / 1000).toFixed(0)}K` : '-'}
              </td>
              <td className="px-4 py-2">{formatPrice(price.price_per_1m_input)}</td>
              <td className="px-4 py-2">{formatPrice(price.price_per_1m_output)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] No lint errors: `npm run lint`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] `/providers/openai` shows inference pricing table
- [ ] `/providers/deep-infra` shows BOTH GPU pricing AND inference pricing
- [ ] `/providers/aws` shows only GPU pricing (no inference section)

**Implementation Note**: This completes the core implementation. Review all functionality before marking complete.

---

## Testing Strategy

### Unit Tests:
- Test `fetchLLMPrices()` returns expected data structure
- Test `fetchLLMModels()` returns models
- Test `fetchInferenceProviders()` filters by type correctly

### Integration Tests:
- Test `/inference` page renders without errors
- Test provider pages show correct sections based on type

### Manual Testing Steps:
1. Navigate to `/inference` and verify table displays
2. Sort by input price, output price - verify order changes
3. Filter by creator - verify results filter
4. Click provider link - verify navigation works
5. Visit `/providers/deep-infra` - verify both GPU and inference sections show
6. Visit `/providers/openai` - verify only inference section shows
7. Add a new price via script - verify it appears on refresh

---

## Migration Notes

- Existing GPU compute data is unaffected
- `providers.type` defaults to `'gpu_compute'` for existing records
- No changes to existing scraper behavior
- Manual migration needed: Update DeepInfra and Hyperstack `type` to `'both'`

---

## References

- Research document: `thoughts/shared/research/2025-12-22-inference-api-provider-research.md`
- Existing GPU schema: `supabase/migrations/00001_initial_schema.sql`
- Provider system: `lib/providers.ts`, `data/providers.json`
- GetDeploying reference: https://getdeploying.com/llm-price-comparison
- Artificial Analysis reference: https://artificialanalysis.ai/leaderboards/providers
