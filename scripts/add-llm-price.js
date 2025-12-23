import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addLLMPrice(providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl) {
  // Get provider ID
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('id')
    .eq('slug', providerSlug)
    .single();

  if (providerError || !provider) {
    console.error(`Provider not found: ${providerSlug}`);
    return;
  }

  // Get model ID
  const { data: model, error: modelError } = await supabase
    .from('llm_models')
    .select('id')
    .eq('slug', modelSlug)
    .single();

  if (modelError || !model) {
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

// Usage: node scripts/add-llm-price.js <provider-slug> <model-slug> <input-price> <output-price> [source-url]
const [,, providerSlug, modelSlug, inputPrice, outputPrice, sourceUrl] = process.argv;

if (!providerSlug || !modelSlug || !inputPrice || !outputPrice) {
  console.log('Usage: node scripts/add-llm-price.js <provider-slug> <model-slug> <input-price> <output-price> [source-url]');
  console.log('Example: node scripts/add-llm-price.js openai gpt-4o 2.50 10.00 https://openai.com/api/pricing');
  process.exit(1);
}

addLLMPrice(providerSlug, modelSlug, parseFloat(inputPrice), parseFloat(outputPrice), sourceUrl || null);
