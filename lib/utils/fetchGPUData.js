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

    const getProviderSlug = (provider) => provider.slug || provider.name.toLowerCase().replace(/\s+/g, '-');

    const provider1Slug = getProviderSlug(provider1);
    const provider2Slug = getProviderSlug(provider2);

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
          provider_slug: provider1Slug
        } : null,
        provider2: provider2Price ? {
          ...provider2Price,
          provider_name: provider2.name,
          provider_slug: provider2Slug
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
        slug: provider1Slug
      },
      provider2: {
        id: provider2.id, 
        name: provider2.name,
        slug: provider2Slug
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

// Get latest price drops by analyzing actual price history
export async function getLatestPriceDrops(hoursWindow = 48, minChangePercent = 5) {
  try {
    const { data, error } = await supabase.rpc('get_price_changes', {
      hours_window: hoursWindow,
      min_change_percent: minChangePercent
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        hasAlert: false,
        message: "No significant price changes detected",
        alertType: "none",
        changes: []
      };
    }

    // Filter for price drops only (negative percent_change)
    const priceDrops = data.filter(change => change.percent_change < 0);

    if (priceDrops.length === 0) {
      // Check for price increases
      const priceIncreases = data.filter(change => change.percent_change > 0);
      if (priceIncreases.length > 0) {
        const topIncrease = priceIncreases[priceIncreases.length - 1]; // Highest increase
        return {
          hasAlert: true,
          message: `${topIncrease.gpu_model_name} prices increased ${Math.abs(topIncrease.percent_change)}% on ${topIncrease.provider_name}`,
          alertType: "price_increase",
          gpuModel: topIncrease.gpu_model_name,
          gpuSlug: topIncrease.gpu_model_slug,
          providerName: topIncrease.provider_name,
          percentageChange: topIncrease.percent_change,
          currentPrice: topIncrease.current_price,
          previousPrice: topIncrease.previous_price,
          changes: priceIncreases
        };
      }
      return {
        hasAlert: false,
        message: "No significant price changes detected",
        alertType: "none",
        changes: []
      };
    }

    // Group price drops by GPU to find the most impactful
    const dropsByGPU = priceDrops.reduce((acc, drop) => {
      if (!acc[drop.gpu_model_id]) {
        acc[drop.gpu_model_id] = {
          gpuModelId: drop.gpu_model_id,
          gpuModelName: drop.gpu_model_name,
          gpuModelSlug: drop.gpu_model_slug,
          providers: [],
          totalDrops: 0,
          maxDrop: 0
        };
      }
      acc[drop.gpu_model_id].providers.push({
        providerName: drop.provider_name,
        providerId: drop.provider_id,
        percentChange: drop.percent_change,
        currentPrice: drop.current_price,
        previousPrice: drop.previous_price
      });
      acc[drop.gpu_model_id].totalDrops++;
      if (drop.percent_change < acc[drop.gpu_model_id].maxDrop) {
        acc[drop.gpu_model_id].maxDrop = drop.percent_change;
      }
      return acc;
    }, {});

    // Find the GPU with the most provider drops or largest single drop
    const gpuDrops = Object.values(dropsByGPU);
    const topDrop = gpuDrops.sort((a, b) => {
      // Prioritize GPUs with drops across multiple providers
      if (b.totalDrops !== a.totalDrops) return b.totalDrops - a.totalDrops;
      // Then by largest drop percentage
      return a.maxDrop - b.maxDrop;
    })[0];

    const message = topDrop.totalDrops > 1
      ? `${topDrop.gpuModelName} prices dropped up to ${Math.abs(topDrop.maxDrop)}% across ${topDrop.totalDrops} providers`
      : `${topDrop.gpuModelName} prices dropped ${Math.abs(topDrop.maxDrop)}% on ${topDrop.providers[0].providerName}`;

    return {
      hasAlert: true,
      message,
      alertType: "price_drop",
      gpuModel: topDrop.gpuModelName,
      gpuSlug: topDrop.gpuModelSlug,
      providerCount: topDrop.totalDrops,
      percentageChange: topDrop.maxDrop,
      providers: topDrop.providers,
      changes: priceDrops
    };
  } catch (error) {
    console.error('Error fetching price drops:', error);
    return {
      hasAlert: false,
      message: "Unable to check price changes",
      alertType: "error",
      changes: []
    };
  }
}

// Function to find providers with shared GPUs for comparison suggestions
export async function getProviderSuggestions(currentProviderId) {
  try {
    console.log('getProviderSuggestions called with currentProviderId:', currentProviderId);
    
    // Get GPU models that current provider offers
    const currentProviderGPUs = await fetchGPUPrices({ selectedProvider: currentProviderId });
    const currentGPUIds = [...new Set(currentProviderGPUs.map(p => p.gpu_model_id))];
    
    if (currentGPUIds.length === 0) {
      return [];
    }
    
    // Get all providers and their GPU offerings
    const allProviders = await fetchProviders();
    const allPrices = await fetchGPUPrices({});
    
    // Count shared GPUs per provider
    const providerSharedGPUs = new Map();
    
    allPrices.forEach(price => {
      if (price.provider_id !== currentProviderId && currentGPUIds.includes(price.gpu_model_id)) {
        if (!providerSharedGPUs.has(price.provider_id)) {
          const provider = allProviders.find(p => p.id === price.provider_id);
          if (provider) {
            const providerSlug = provider.slug || provider.name.toLowerCase().replace(/\s+/g, '-');

            providerSharedGPUs.set(price.provider_id, {
              id: provider.id,
              name: provider.name,
              // Prefer the canonical slug from the provider record to match logo filenames/routes
              slug: providerSlug,
              sharedGPUs: 0,
              sharedGPUIds: new Set()
            });
          }
        }
        const providerData = providerSharedGPUs.get(price.provider_id);
        if (providerData && !providerData.sharedGPUIds.has(price.gpu_model_id)) {
          providerData.sharedGPUs++;
          providerData.sharedGPUIds.add(price.gpu_model_id);
        }
      }
    });
    
    // Return top 3 providers with most shared GPUs
    return Array.from(providerSharedGPUs.values())
      .map(provider => ({
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        sharedGPUs: provider.sharedGPUs
      }))
      .sort((a, b) => b.sharedGPUs - a.sharedGPUs)
      .slice(0, 3);
      
  } catch (error) {
    console.error('Error getting provider suggestions:', error);
    return [];
  }
} 
