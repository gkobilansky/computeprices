import { supabase } from '@/lib/supabase';
import { cache } from 'react';

/**
 * Cached function to get SEO statistics from the database.
 * Uses React cache() to deduplicate requests within a single render.
 */
export const getSEOStats = cache(async () => {
  try {
    // Get GPU count
    const { data: gpuData, error: gpuError } = await supabase
      .from('gpu_models')
      .select('id', { count: 'exact', head: true });

    if (gpuError) throw gpuError;

    // Get provider count
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true });

    if (providerError) throw providerError;

    // Get latest prices to determine active GPUs and price range
    const { data: priceData, error: priceError } = await supabase
      .rpc('get_latest_prices', {
        selected_provider: null,
        selected_gpu: null
      });

    if (priceError) throw priceError;

    // Calculate price statistics
    const prices = priceData?.map(p => p.price_per_hour).filter(p => p > 0) || [];
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Get unique provider count from prices (active providers with current listings)
    const activeProviderIds = new Set(priceData?.map(p => p.provider_id) || []);

    // Get unique GPU count from prices (GPUs with current listings)
    const activeGpuIds = new Set(priceData?.map(p => p.gpu_model_id) || []);

    // Get popular GPU names for SEO
    const gpuCounts = {};
    priceData?.forEach(p => {
      gpuCounts[p.gpu_model_name] = (gpuCounts[p.gpu_model_name] || 0) + 1;
    });
    const popularGPUs = Object.entries(gpuCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return {
      gpuCount: gpuData?.length || 0,
      providerCount: providerData?.length || 0,
      activeProviderCount: activeProviderIds.size,
      activeGpuCount: activeGpuIds.size,
      pricePointCount: priceData?.length || 0,
      lowestPrice: lowestPrice.toFixed(2),
      highestPrice: highestPrice.toFixed(2),
      popularGPUs,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching SEO stats:', error);
    // Return sensible defaults
    return {
      gpuCount: 50,
      providerCount: 15,
      activeProviderCount: 12,
      activeGpuCount: 30,
      pricePointCount: 500,
      lowestPrice: '0.20',
      highestPrice: '5.00',
      popularGPUs: ['H100', 'A100', 'L40S', 'RTX 4090', 'A10'],
      lastUpdated: new Date().toISOString(),
    };
  }
});

/**
 * Get provider count for a specific GPU
 */
export const getGPUProviderCount = cache(async (gpuId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_prices', {
        selected_provider: null,
        selected_gpu: gpuId
      });

    if (error) throw error;

    const providerIds = new Set(data?.map(p => p.provider_id) || []);
    const prices = data?.map(p => p.price_per_hour).filter(p => p > 0) || [];

    return {
      providerCount: providerIds.size,
      lowestPrice: prices.length > 0 ? Math.min(...prices).toFixed(2) : null,
      highestPrice: prices.length > 0 ? Math.max(...prices).toFixed(2) : null,
    };
  } catch (error) {
    console.error('Error fetching GPU provider count:', error);
    return {
      providerCount: 10,
      lowestPrice: null,
      highestPrice: null,
    };
  }
});

/**
 * Get GPU count for a specific provider
 */
export const getProviderGPUCount = cache(async (providerId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_prices', {
        selected_provider: providerId,
        selected_gpu: null
      });

    if (error) throw error;

    const gpuIds = new Set(data?.map(p => p.gpu_model_id) || []);
    const prices = data?.map(p => p.price_per_hour).filter(p => p > 0) || [];

    // Get GPU names
    const gpuNames = [...new Set(data?.map(p => p.gpu_model_name) || [])];

    return {
      gpuCount: gpuIds.size,
      gpuNames,
      lowestPrice: prices.length > 0 ? Math.min(...prices).toFixed(2) : null,
      highestPrice: prices.length > 0 ? Math.max(...prices).toFixed(2) : null,
    };
  } catch (error) {
    console.error('Error fetching provider GPU count:', error);
    return {
      gpuCount: 10,
      gpuNames: [],
      lowestPrice: null,
      highestPrice: null,
    };
  }
});

/**
 * Generate dynamic homepage title with real data
 */
export async function generateHomepageTitle() {
  const stats = await getSEOStats();
  return `Cloud GPU Price Comparison: Compare ${stats.activeProviderCount}+ Providers | ComputePrices.com`;
}

/**
 * Generate dynamic homepage description with real data
 */
export async function generateHomepageDescription() {
  const stats = await getSEOStats();
  const gpuList = stats.popularGPUs.slice(0, 3).join(', ');
  return `Compare cloud GPU prices across ${stats.activeProviderCount}+ providers. Find the cheapest ${gpuList} rates from $${stats.lowestPrice}/hr. Updated ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`;
}

/**
 * Generate dynamic GPU list page metadata
 */
export async function generateGPUListMetadata() {
  const stats = await getSEOStats();
  return {
    title: `${stats.activeGpuCount}+ Cloud GPUs: Specs, Pricing & Use Cases | ComputePrices.com`,
    description: `Compare ${stats.activeGpuCount}+ GPU models including ${stats.popularGPUs.slice(0, 3).join(', ')}. View detailed specs, cloud pricing from $${stats.lowestPrice}/hr, and find the best GPU for AI, ML, and deep learning workloads.`,
  };
}

/**
 * Generate dynamic provider list page metadata
 */
export async function generateProviderListMetadata() {
  const stats = await getSEOStats();
  return {
    title: `${stats.activeProviderCount}+ GPU Cloud Providers Compared | ComputePrices.com`,
    description: `Compare ${stats.activeProviderCount}+ cloud GPU providers. Find ${stats.popularGPUs.slice(0, 2).join(' and ')} pricing from $${stats.lowestPrice}/hr. Hyperscalers, neoclouds, and marketplace options reviewed.`,
  };
}
