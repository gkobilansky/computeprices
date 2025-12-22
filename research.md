# Research: Market Bifurcation & Inference API Tracking

## Executive Summary

The AI inference infrastructure market is bifurcating into two economically distinct segments:
1. **Reserved/Hourly Compute** - What computeprices.com currently tracks (GPU-hours)
2. **Inference APIs** - Pay-per-token model (new opportunity)

This research explores whether computeprices.com should expand to track inference API pricing alongside reserved compute.

---

## The Market Bifurcation

Based on [Chris Zeoli's analysis](https://www.datagravity.dev/p/inference-economics-101-reserved):

### Reserved/Hourly Compute (Current Focus)
- **Value proposition**: Predictability, control, determinism
- **Customer profile**: Fewer customers, larger contracts
- **Providers**: Lambda Labs, CoreWeave, RunPod, AWS, Azure, etc.
- **Pricing model**: $/GPU-hour

### Inference APIs (New Segment)
- **Value proposition**: Absorb utilization risk, elastic capacity, no provisioning
- **Customer profile**: Many smaller customers, bursty workloads
- **Providers**: Fireworks AI, Together AI, DeepInfra, Groq, OpenAI, Anthropic
- **Pricing model**: $/token (input and output separately)

### Key Economic Insight

> "Utilization variance dominates performance variance"

- Performance spreads: 1.3–2.1x variance in throughput
- Utilization spreads: 40-55% (single-tenant) vs 70-85% (aggregated platforms) = 1.5-2.0x cost difference
- Inference APIs win by aggregating heterogeneous demand across hundreds of customers

---

## Current State: computeprices.com

### What We Track
- **16+ cloud GPU providers** with hourly pricing
- **GPU specifications**: VRAM, compute units, architecture, performance tiers
- **Price trends**: Daily aggregated pricing data
- **Provider metadata**: Features, pros/cons, getting started guides

### What We Don't Track
- Per-token inference API pricing
- Model-specific pricing (LLMs, embedding models, image models)
- Performance metrics (tokens/second, latency)
- Provider type classification (reserved compute vs inference API)

### Existing Overlap
Some providers we track offer BOTH services:
| Provider | Reserved Compute | Inference API |
|----------|-----------------|---------------|
| DeepInfra | ✅ (GPU instances) | ✅ (per-token) |
| Together AI | ✅ (dedicated endpoints) | ✅ (serverless) |
| RunPod | ✅ (Pods) | ✅ (Serverless) |
| Lambda Labs | ✅ (Cloud instances) | ❌ |
| CoreWeave | ✅ (Kubernetes) | ❌ |
| Fireworks AI | ✅ (On-demand GPUs) | ✅ (serverless) |

---

## Competitive Landscape

### Primary Competitor: Artificial Analysis
[artificialanalysis.ai](https://artificialanalysis.ai/leaderboards/providers) is the dominant player in inference API comparison:

**What they track:**
- 500+ AI model endpoints across providers
- Price per token (blended 3:1 input:output ratio)
- Output speed (tokens/second)
- Latency (time to first token)
- Context window support

**Providers covered:**
- OpenAI, Google Vertex, Amazon Bedrock, Together AI, Groq, DeepInfra, Fireworks, Databricks, Novita, Cloudflare, and more

**Their methodology:**
- Real-world performance telemetry
- 14-day rolling median with P5/P25/P75/P95 distributions
- Standardized benchmarking across endpoints

### Other Competitors
- [llm-stats.com](https://llm-stats.com) - AI leaderboards across modalities
- [Vellum LLM Leaderboard](https://www.vellum.ai/llm-leaderboard) - Benchmark comparisons

---

## Inference API Pricing Structure

### Per-Token Pricing Examples (December 2025)

**Fireworks AI:**
| Model Size | Input ($/1M) | Output ($/1M) |
|------------|-------------|---------------|
| <4B params | $0.10 | - |
| 4B-16B | $0.20 | - |
| 16B+ | $0.90 | - |
| DeepSeek V3 | $0.56 | $1.68 |
| DeepSeek R1 | $1.35 | $5.40 |

**Together AI:**
| Model | Input ($/1M) | Output ($/1M) |
|-------|-------------|---------------|
| Llama 3.2 3B | $0.06 | $0.06 |
| Llama 3.1 70B | $0.88 | $0.88 |
| Llama 3.1 405B | $3.50 | $3.50 |
| DeepSeek R1 | $3.00 | $7.00 |

**Key Pricing Features:**
- Input tokens ~3-5x cheaper than output tokens (parallelization)
- Batch inference: 50% discount typical
- Cached/prompt caching: 50% off input tokens
- Off-peak pricing (DeepSeek): 50-75% cheaper

### GPU-Hour Pricing (Same Providers)

| Provider | H100/hr | A100/hr | H200/hr |
|----------|---------|---------|---------|
| Fireworks | $4.00 | $2.90 | $6.00 |
| Together | $3.36 | $2.56 | $4.99 |
| DeepInfra | ~$2.50 | ~$1.80 | - |

---

## Recommendation: Should We Add Inference API Tracking?

### Arguments FOR

1. **Captures the full market picture**
   - Many users are choosing between reserved compute AND inference APIs
   - Decision depends on utilization patterns, not just raw price

2. **Unique positioning opportunity**
   - No one currently shows BOTH pricing models side-by-side
   - Could help users calculate breakeven points between models

3. **Leverages existing provider relationships**
   - DeepInfra, Together, RunPod already in our system
   - Can expand coverage with same providers

4. **Growing market segment**
   - Inference API market expanding rapidly
   - Price drops of 50-200x/year observed (Epoch AI)

5. **Natural user journey**
   - Users often start with inference APIs, then graduate to reserved compute
   - Could capture users earlier in their journey

### Arguments AGAINST

1. **Strong incumbent competition**
   - Artificial Analysis has 500+ endpoints, real performance data
   - Would be difficult to match their depth quickly

2. **Different data model complexity**
   - Per-token pricing requires tracking: model name, version, input/output prices, batch discounts, context windows
   - Much more complex than GPU hourly pricing

3. **Performance metrics are critical**
   - Token pricing alone isn't useful without speed/latency data
   - Would need to build benchmarking infrastructure

4. **Scope creep risk**
   - Inference APIs span LLMs, embeddings, image gen, audio, video
   - Could dilute focus from core GPU pricing value prop

5. **Different target audience**
   - Reserved compute: ML engineers, infrastructure teams
   - Inference APIs: Application developers, product teams

---

## Strategic Options

### Option A: Full Inference API Expansion
**Scope:** Track all major inference APIs with per-token pricing
**Effort:** High (6+ months, new schema, new scrapers, benchmarking)
**Differentiation:** Combine GPU pricing + inference pricing in one place

**Schema additions:**
```sql
-- New table: inference_models
CREATE TABLE inference_models (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,           -- "Llama 3.1 70B", "GPT-4o"
  provider TEXT,                -- "Meta", "OpenAI"
  model_family TEXT,            -- "Llama 3.1", "GPT-4"
  parameter_count BIGINT,       -- 70000000000
  context_window INT,           -- 128000
  modality TEXT[],              -- ['text', 'vision']
  release_date DATE
);

-- New table: inference_prices
CREATE TABLE inference_prices (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  model_id UUID REFERENCES inference_models(id),
  input_price_per_million DECIMAL,   -- $/1M input tokens
  output_price_per_million DECIMAL,  -- $/1M output tokens
  cached_input_price DECIMAL,        -- $/1M cached tokens
  batch_discount_percent INT,        -- e.g., 50 for 50% off
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add provider classification
ALTER TABLE providers ADD COLUMN provider_type TEXT[];
-- Values: ['reserved_compute', 'inference_api', 'both']
```

### Option B: Provider Type Classification Only
**Scope:** Classify existing providers, add metadata about their inference offerings
**Effort:** Low (1-2 weeks)
**Differentiation:** Help users understand which providers offer what

**Changes:**
- Add `provider_type` field to providers table
- Add `inference_api_url` to provider metadata
- Blog content explaining the bifurcation
- Landing page showing providers by type

### Option C: Breakeven Calculator Tool
**Scope:** Build a tool comparing reserved compute vs inference API costs
**Effort:** Medium (1-2 months)
**Differentiation:** Unique value not offered by competitors

**Features:**
- Input: expected tokens/day, utilization patterns
- Output: Cost comparison between renting GPUs vs using inference APIs
- Uses existing GPU pricing + hardcoded inference API pricing (manual updates)
- Educational content on when to switch models

### Option D: Strategic Partnership
**Scope:** Partner with Artificial Analysis or similar
**Effort:** Variable
**Differentiation:** Combine their inference data with our GPU data

---

## Recommended Approach: Phased Implementation

### Phase 1: Foundation (Option B) - 2 weeks
1. Add `provider_type` classification to existing providers
2. Add inference API metadata to providers who offer both services
3. Create blog content explaining the market bifurcation
4. Update provider pages to show which service types they offer

### Phase 2: Breakeven Calculator (Option C) - 1 month
1. Build interactive tool comparing reserved vs inference costs
2. Curate manual dataset of major inference API prices (10-15 providers)
3. Create educational content on utilization economics
4. Drive traffic with unique calculators competitors don't have

### Phase 3: Evaluate Full Expansion (Option A) - Q2 2026
1. Monitor user engagement with Phase 1-2 features
2. Assess competitive response from Artificial Analysis
3. If positive signals, build out full inference tracking infrastructure
4. Consider acquisition or partnership before building

---

## Appendix: Data Sources

### Inference API Pricing Sources
- [Fireworks AI Pricing](https://fireworks.ai/pricing)
- [Together AI Pricing](https://together.ai/pricing)
- [DeepInfra Pricing](https://deepinfra.com/pricing)
- [Artificial Analysis Providers](https://artificialanalysis.ai/leaderboards/providers)
- [LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Epoch AI: LLM Inference Price Trends](https://epoch.ai/data-insights/llm-inference-price-trends)

### Market Analysis Sources
- [Inference Economics 101 - Data Gravity](https://www.datagravity.dev/p/inference-economics-101-reserved)
- [LLM Total Cost of Ownership 2025](https://www.ptolemay.com/post/llm-total-cost-of-ownership)

---

## Questions for Discussion

1. **Target audience**: Should we expand to serve application developers (inference API users) or stay focused on ML infrastructure teams?

2. **Competitive moat**: Can we differentiate from Artificial Analysis, or would we be a lesser version?

3. **Resource allocation**: Is this the highest-impact use of development time vs improving existing GPU tracking?

4. **Revenue model**: Would inference API tracking attract different advertisers/sponsors?

5. **Data freshness**: Inference API prices change frequently (weekly). Can we maintain accurate data?
