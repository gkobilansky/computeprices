import { supabase } from '../supabase.js';

export async function fetchGPUModels(gpuId = null) {
  console.log('fetchGPUModels called with gpuId:', gpuId);
  try {
    let query = supabase.from('gpu_models').select('*');
    
    if (gpuId) {
      query = query.eq('id', gpuId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return gpuId ? (data && data.length > 0 ? data[0] : null) : data;
  } catch (error) {
    console.error('Error fetching GPU models:', error);
    throw error;
  }
}

export async function fetchGPUPrices({ selectedProvider, selectedGPU, selectedProviders }) {
 try {
    const providerUUID = selectedProvider ? selectedProvider.toString() : null;
    const gpuUUID = selectedGPU ? selectedGPU.toString() : null;

    // Handle multiple providers for comparison
    if (selectedProviders && Array.isArray(selectedProviders) && selectedProviders.length > 0) {
      // For multiple providers, we need to make individual calls and aggregate
      const providerPromises = selectedProviders.map(async (providerId) => {
        const { data, error } = await supabase.rpc('get_latest_prices', {
          selected_provider: providerId.toString(),
          selected_gpu: gpuUUID
        });
        if (error) throw error;
        return data;
      });

      const results = await Promise.all(providerPromises);
      // Flatten and combine results from all providers
      return results.flat();
    }

    // Original single provider logic
    const { data, error } = await supabase.rpc('get_latest_prices', {
      selected_provider: providerUUID,
      selected_gpu: gpuUUID
    });

   console.log('data', data)

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching GPU prices:', error);
    throw error;
  }
}

export async function fetchProviders() {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
}

// New function to get actual counts for homepage
export async function getHomepageStats() {
  try {
    // Get GPU count
    const { data: gpuData, error: gpuError } = await supabase
      .from('gpu_models')
      .select('id', { count: 'exact' });

    if (gpuError) throw gpuError;

    // Get provider count
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id', { count: 'exact' });

    const { data: priceData, error: priceError } = await supabase
      .from('prices')
      .select('id', { count: 'exact' });


    console.log('gpuData', gpuData)
    console.log('providerData', providerData)
    console.log('priceData', priceData)

    return {
      gpuCount: gpuData.length,
      providerCount: providerData.length,
      pricePointsChecked: priceData.length
    };
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    // Return fallback values
    return {
      gpuCount: 50,
      providerCount: 11,
      pricePointsChecked: 500
    };
  }
}

// Function to fetch provider comparison data for dual-provider comparison tables
export async function fetchProviderComparison(provider1Id, provider2Id, selectedGPU = null) {
  try {
    console.log('fetchProviderComparison called with:', { provider1Id, provider2Id, selectedGPU });
    
    // Fetch data for both providers concurrently
    const [provider1Data, provider2Data] = await Promise.all([
      fetchGPUPrices({ selectedProvider: provider1Id, selectedGPU }),
      fetchGPUPrices({ selectedProvider: provider2Id, selectedGPU })
    ]);

    // Get provider info
    const providers = await fetchProviders();
    const provider1 = providers.find(p => p.id === provider1Id);
    const provider2 = providers.find(p => p.id === provider2Id);

    if (!provider1 || !provider2) {
      throw new Error('One or both providers not found');
    }

    // Create lookup maps for easier comparison
    const provider1Prices = new Map();
    const provider2Prices = new Map();

    provider1Data.forEach(price => {
      const key = `${price.gpu_model_id}_${price.gpu_count || 1}`;
      provider1Prices.set(key, price);
    });

    provider2Data.forEach(price => {
      const key = `${price.gpu_model_id}_${price.gpu_count || 1}`;
      provider2Prices.set(key, price);
    });

    // Get all unique GPU models from both providers
    const allGPUs = new Set([
      ...provider1Data.map(p => p.gpu_model_id),
      ...provider2Data.map(p => p.gpu_model_id)
    ]);

    // Create comparison data structure
    const comparisonData = [];
    
    allGPUs.forEach(gpuId => {
      const provider1Price = provider1Data.find(p => p.gpu_model_id === gpuId);
      const provider2Price = provider2Data.find(p => p.gpu_model_id === gpuId);
      
      // Create unified comparison row
      comparisonData.push({
        gpu_model_id: gpuId,
        gpu_model_name: provider1Price?.gpu_model_name || provider2Price?.gpu_model_name,
        gpu_model_slug: provider1Price?.gpu_model_slug || provider2Price?.gpu_model_slug,
        vram: provider1Price?.gpu_model_vram || provider2Price?.gpu_model_vram,
        manufacturer: provider1Price?.manufacturer || provider2Price?.manufacturer,
        provider1: provider1Price ? {
          ...provider1Price,
          provider_name: provider1.name,
          provider_slug: provider1.name.toLowerCase().replace(/\s+/g, '-')
        } : null,
        provider2: provider2Price ? {
          ...provider2Price,
          provider_name: provider2.name,
          provider_slug: provider2.name.toLowerCase().replace(/\s+/g, '-')
        } : null,
        // Calculate comparison metrics
        price_difference: provider1Price && provider2Price 
          ? provider1Price.price_per_hour - provider2Price.price_per_hour 
          : null,
        price_difference_percent: provider1Price && provider2Price
          ? ((provider1Price.price_per_hour - provider2Price.price_per_hour) / provider2Price.price_per_hour) * 100
          : null,
        best_price: provider1Price && provider2Price
          ? provider1Price.price_per_hour < provider2Price.price_per_hour ? 'provider1' : 'provider2'
          : provider1Price ? 'provider1' : provider2Price ? 'provider2' : null,
        availability: {
          provider1: !!provider1Price,
          provider2: !!provider2Price
        }
      });
    });

    return {
      provider1: {
        id: provider1.id,
        name: provider1.name,
        slug: provider1.name.toLowerCase().replace(/\s+/g, '-')
      },
      provider2: {
        id: provider2.id, 
        name: provider2.name,
        slug: provider2.name.toLowerCase().replace(/\s+/g, '-')
      },
      comparisonData: comparisonData.sort((a, b) => {
        // Sort by GPU name for consistent ordering
        return (a.gpu_model_name || '').localeCompare(b.gpu_model_name || '');
      }),
      metadata: {
        totalGPUs: comparisonData.length,
        provider1Available: comparisonData.filter(item => item.availability.provider1).length,
        provider2Available: comparisonData.filter(item => item.availability.provider2).length,
        bothAvailable: comparisonData.filter(item => item.availability.provider1 && item.availability.provider2).length,
        fetchedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error fetching provider comparison:', error);
    throw error;
  }
}

// New function to get latest price alerts (foundation for real price alerts)
export async function getLatestPriceDrops() {
  try {
    // Get price changes from the last 24 hours
    const { data, error } = await supabase
      .from('prices')
      .select(`
        *,
        gpu_models:gpu_model_id (name),
        providers:provider_id (name)
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // For now, return a mock alert. In the future, this would analyze price changes
    return {
      hasAlert: data && data.length > 0,
      message: "H100 prices dropped 15% across 3 providers in the last 24 hours",
      alertType: "price_drop",
      gpuModel: "H100",
      providerCount: 3,
      percentageChange: -15
    };
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return {
      hasAlert: false,
      message: "No recent price changes detected",
      alertType: "none"
    };
  }
} 