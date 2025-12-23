import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initial pricing data - prices per 1M tokens
// Format: [providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl]
const pricingData = [
  // OpenAI
  ['openai', 'gpt-4o', 2.50, 10.00, 'https://openai.com/api/pricing'],
  ['openai', 'gpt-4o-mini', 0.15, 0.60, 'https://openai.com/api/pricing'],
  ['openai', 'gpt-4-1', 2.00, 8.00, 'https://openai.com/api/pricing'],
  ['openai', 'gpt-4-1-mini', 0.40, 1.60, 'https://openai.com/api/pricing'],
  ['openai', 'o1', 15.00, 60.00, 'https://openai.com/api/pricing'],
  ['openai', 'o1-mini', 1.10, 4.40, 'https://openai.com/api/pricing'],
  ['openai', 'o3-mini', 1.10, 4.40, 'https://openai.com/api/pricing'],

  // Anthropic
  ['anthropic', 'claude-3-5-sonnet', 3.00, 15.00, 'https://www.anthropic.com/pricing'],
  ['anthropic', 'claude-3-5-haiku', 0.80, 4.00, 'https://www.anthropic.com/pricing'],
  ['anthropic', 'claude-3-opus', 15.00, 75.00, 'https://www.anthropic.com/pricing'],

  // Together AI
  ['together-ai', 'llama-3-3-70b', 0.88, 0.88, 'https://www.together.ai/pricing'],
  ['together-ai', 'llama-3-1-405b', 3.50, 3.50, 'https://www.together.ai/pricing'],
  ['together-ai', 'llama-3-1-70b', 0.88, 0.88, 'https://www.together.ai/pricing'],
  ['together-ai', 'llama-3-1-8b', 0.18, 0.18, 'https://www.together.ai/pricing'],
  ['together-ai', 'deepseek-v3', 0.90, 0.90, 'https://www.together.ai/pricing'],
  ['together-ai', 'deepseek-r1', 3.00, 7.00, 'https://www.together.ai/pricing'],
  ['together-ai', 'mistral-large', 2.00, 6.00, 'https://www.together.ai/pricing'],
  ['together-ai', 'mixtral-8x7b', 0.60, 0.60, 'https://www.together.ai/pricing'],
  ['together-ai', 'qwen-2-5-72b', 0.90, 0.90, 'https://www.together.ai/pricing'],

  // Fireworks AI
  ['fireworks-ai', 'llama-3-3-70b', 0.90, 0.90, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'llama-3-1-405b', 3.00, 3.00, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'llama-3-1-70b', 0.90, 0.90, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'llama-3-1-8b', 0.20, 0.20, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'deepseek-v3', 0.90, 0.90, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'deepseek-r1', 3.00, 8.00, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'mistral-large', 2.00, 6.00, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'mixtral-8x7b', 0.50, 0.50, 'https://fireworks.ai/pricing'],
  ['fireworks-ai', 'qwen-2-5-72b', 0.90, 0.90, 'https://fireworks.ai/pricing'],

  // DeepInfra
  ['deep-infra', 'llama-3-3-70b', 0.35, 0.40, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'llama-3-1-405b', 1.79, 1.79, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'llama-3-1-70b', 0.35, 0.40, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'llama-3-1-8b', 0.055, 0.055, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'deepseek-v3', 0.49, 0.89, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'deepseek-r1', 0.55, 2.19, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'mistral-large', 2.00, 6.00, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'mixtral-8x7b', 0.24, 0.24, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'qwen-2-5-72b', 0.35, 0.40, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'gemma-2-27b', 0.13, 0.13, 'https://deepinfra.com/pricing'],
  ['deep-infra', 'gemma-2-9b', 0.06, 0.06, 'https://deepinfra.com/pricing'],
];

async function seedPrices() {
  console.log('Seeding LLM prices...');

  // First get all providers and models for ID lookup
  const { data: providers } = await supabase.from('providers').select('id, slug');
  const { data: models } = await supabase.from('llm_models').select('id, slug');

  if (!providers || !models) {
    console.error('Failed to fetch providers or models');
    return;
  }

  const providerMap = new Map(providers.map(p => [p.slug, p.id]));
  const modelMap = new Map(models.map(m => [m.slug, m.id]));

  let successCount = 0;
  let errorCount = 0;

  for (const [providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl] of pricingData) {
    const providerId = providerMap.get(providerSlug);
    const modelId = modelMap.get(modelSlug);

    if (!providerId) {
      console.error(`Provider not found: ${providerSlug}`);
      errorCount++;
      continue;
    }

    if (!modelId) {
      console.error(`Model not found: ${modelSlug}`);
      errorCount++;
      continue;
    }

    const { error } = await supabase
      .from('llm_prices')
      .insert({
        provider_id: providerId,
        llm_model_id: modelId,
        price_per_1m_input: inputPrice,
        price_per_1m_output: outputPrice,
        source_url: sourceUrl
      });

    if (error) {
      console.error(`Error inserting ${providerSlug}/${modelSlug}:`, error.message);
      errorCount++;
    } else {
      console.log(`Added: ${providerSlug} / ${modelSlug} - $${inputPrice}/$${outputPrice}`);
      successCount++;
    }
  }

  console.log(`\nDone seeding LLM prices: ${successCount} successful, ${errorCount} errors`);
}

seedPrices();
