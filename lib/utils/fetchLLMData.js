import { supabase } from '../supabase.js';

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

/**
 * Get cheapest prices for each model across all providers
 */
export async function getCheapestLLMPrices() {
  const prices = await fetchLLMPrices();

  // Group by model and find cheapest for input and output
  const modelPrices = new Map();

  for (const price of prices) {
    const existing = modelPrices.get(price.llm_model_id);

    if (!existing) {
      modelPrices.set(price.llm_model_id, {
        model_name: price.model_name,
        model_slug: price.model_slug,
        creator: price.creator,
        context_window: price.context_window,
        cheapest_input: price,
        cheapest_output: price
      });
    } else {
      if (price.price_per_1m_input < existing.cheapest_input.price_per_1m_input) {
        existing.cheapest_input = price;
      }
      if (price.price_per_1m_output < existing.cheapest_output.price_per_1m_output) {
        existing.cheapest_output = price;
      }
    }
  }

  return Array.from(modelPrices.values());
}
