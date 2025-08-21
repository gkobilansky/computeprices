import { supabase } from './supabase';
import { 
  ComparisonFilters, 
  ComparisonOptions, 
  RawPriceData, 
  Provider 
} from '../types/comparison';

/**
 * Fetches GPU pricing data for multiple providers with optimized database queries
 */
export async function fetchMultiProviderPrices(
  providerIds: string[],
  options: {
    gpuModelIds?: string[];
    includeUnavailable?: boolean;
  } = {}
): Promise<RawPriceData[]> {
  try {
    const startTime = Date.now();
    
    if (!providerIds || providerIds.length === 0) {
      throw new Error('At least one provider ID is required');
    }

    // Use parallel requests for better performance with current RPC
    const providerPromises = providerIds.map(async (providerId) => {
      const { data, error } = await supabase.rpc('get_latest_prices', {
        selected_provider: providerId,
        selected_gpu: options.gpuModelIds?.length === 1 ? options.gpuModelIds[0] : null
      });
      
      if (error) {
        console.warn(`Error fetching prices for provider ${providerId}:`, error);
        return [];
      }
      
      return data || [];
    });

    const results = await Promise.all(providerPromises);
    const flattenedData = results.flat();
    
    // Filter by specific GPU models if provided
    let filteredData = flattenedData;
    if (options.gpuModelIds && options.gpuModelIds.length > 1) {
      filteredData = flattenedData.filter(item => 
        options.gpuModelIds!.includes(item.gpu_model_id)
      );
    }

    const queryTime = Date.now() - startTime;
    console.log(`Multi-provider query completed in ${queryTime}ms for ${providerIds.length} providers`);

    return filteredData;
  } catch (error) {
    console.error('Error fetching multi-provider prices:', error);
    throw error;
  }
}

/**
 * Fetches provider comparison data with advanced filtering and sorting
 */
export async function fetchProviderComparisonData(
  filters: ComparisonFilters,
  options: ComparisonOptions = {}
): Promise<RawPriceData[]> {
  try {
    const startTime = Date.now();

    if (!filters.providerIds || filters.providerIds.length < 2) {
      throw new Error('At least two provider IDs are required for comparison');
    }

    // Fetch data for all providers
    const rawData = await fetchMultiProviderPrices(filters.providerIds, {
      gpuModelIds: filters.gpuModelIds,
      includeUnavailable: options.includeUnavailable
    });

    // Apply additional filters
    let filteredData = rawData;

    // Price range filtering
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filteredData = filteredData.filter(item => {
        const price = parseFloat(item.price_per_hour);
        const minCheck = filters.minPrice === undefined || price >= filters.minPrice;
        const maxCheck = filters.maxPrice === undefined || price <= filters.maxPrice;
        return minCheck && maxCheck;
      });
    }

    // VRAM filtering
    if (filters.minVRAM !== undefined || filters.maxVRAM !== undefined) {
      filteredData = filteredData.filter(item => {
        const vram = item.gpu_vram;
        const minCheck = filters.minVRAM === undefined || vram >= filters.minVRAM;
        const maxCheck = filters.maxVRAM === undefined || vram <= filters.maxVRAM;
        return minCheck && maxCheck;
      });
    }

    // Manufacturer filtering
    if (filters.manufacturers && filters.manufacturers.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.manufacturers!.includes(item.gpu_manufacturer)
      );
    }

    const queryTime = Date.now() - startTime;
    console.log(`Comparison data query completed in ${queryTime}ms`);

    return filteredData;
  } catch (error) {
    console.error('Error fetching provider comparison data:', error);
    throw error;
  }
}

/**
 * Fetches all providers with basic information
 */
export async function fetchAllProviders(): Promise<Provider[]> {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return data?.map(provider => ({
      id: provider.id,
      name: provider.name
    })) || [];
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
}

/**
 * Fetches specific providers by IDs
 */
export async function fetchProvidersByIds(providerIds: string[]): Promise<Provider[]> {
  try {
    if (!providerIds || providerIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('providers')
      .select('id, name')
      .in('id', providerIds)
      .order('name');

    if (error) throw error;

    return data?.map(provider => ({
      id: provider.id,
      name: provider.name
    })) || [];
  } catch (error) {
    console.error('Error fetching providers by IDs:', error);
    throw error;
  }
}

/**
 * Gets the most recent price update timestamp for performance metrics
 */
export async function getLatestPriceTimestamp(): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from('prices')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? new Date(data[0].created_at) : null;
  } catch (error) {
    console.error('Error fetching latest price timestamp:', error);
    return null;
  }
}

/**
 * Optimized query for checking data availability across providers
 */
export async function checkProviderDataAvailability(providerIds: string[]): Promise<{
  providerId: string;
  gpuCount: number;
  priceCount: number;
  lastUpdate: string | null;
}[]> {
  try {
    const availabilityPromises = providerIds.map(async (providerId) => {
      // Get GPU count and latest price for this provider
      const { data, error } = await supabase
        .from('prices')
        .select('gpu_model_id, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn(`Error checking availability for provider ${providerId}:`, error);
        return {
          providerId,
          gpuCount: 0,
          priceCount: 0,
          lastUpdate: null
        };
      }

      const uniqueGPUs = new Set(data?.map(p => p.gpu_model_id) || []);
      
      return {
        providerId,
        gpuCount: uniqueGPUs.size,
        priceCount: data?.length || 0,
        lastUpdate: data && data.length > 0 ? data[0].created_at : null
      };
    });

    return await Promise.all(availabilityPromises);
  } catch (error) {
    console.error('Error checking provider data availability:', error);
    throw error;
  }
}