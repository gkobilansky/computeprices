import { 
  ProviderComparisonData,
  GPUComparison,
  ProviderPrice,
  PriceDifference,
  RawPriceData,
  ProcessedComparisonData,
  ComparisonMetadata,
  Provider,
  ComparisonFilters,
  ComparisonOptions
} from '../types/comparison';
import { GPUModel } from '../types/index';
import { 
  fetchProviderComparisonData, 
  fetchProvidersByIds,
  getLatestPriceTimestamp 
} from './database';

/**
 * Main function to fetch and process provider comparison data
 */
export async function fetchProviderComparison(
  filters: ComparisonFilters,
  options: ComparisonOptions = {}
): Promise<ProviderComparisonData> {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!filters.providerIds || filters.providerIds.length < 2) {
      throw new Error('At least two providers are required for comparison');
    }

    // Fetch data in parallel
    const [rawPriceData, providersData, latestUpdate] = await Promise.all([
      fetchProviderComparisonData(filters, options),
      fetchProvidersByIds(filters.providerIds),
      getLatestPriceTimestamp()
    ]);

    // Process the raw data
    const processedData = processRawComparisonData(rawPriceData);
    
    // Convert to final format
    const gpuComparisons = Array.from(processedData.gpuComparisons.values());
    
    // Apply sorting if specified
    if (options.sortBy) {
      sortGPUComparisons(gpuComparisons, options.sortBy, options.sortOrder || 'asc');
    }

    // Apply pagination if specified
    const paginatedComparisons = options.limit 
      ? gpuComparisons.slice(options.offset || 0, (options.offset || 0) + options.limit)
      : gpuComparisons;

    // Build metadata
    const queryTime = Date.now() - startTime;
    const metadata: ComparisonMetadata = {
      lastUpdated: latestUpdate || new Date(),
      totalGPUs: processedData.metadata.totalGPUs,
      totalProviders: providersData.length,
      priceRange: processedData.metadata.priceRange,
      queryTime
    };

    return {
      providers: providersData,
      gpuComparisons: paginatedComparisons,
      metadata
    };

  } catch (error) {
    console.error('Error fetching provider comparison:', error);
    throw error;
  }
}

/**
 * Processes raw price data into structured comparison format
 */
export function processRawComparisonData(rawData: RawPriceData[]): ProcessedComparisonData {
  const gpuComparisons = new Map<string, GPUComparison>();
  const providers = new Map<string, Provider>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  // Group data by GPU model
  const gpuGroups = new Map<string, RawPriceData[]>();
  
  rawData.forEach(item => {
    // Track providers
    if (!providers.has(item.provider_id)) {
      providers.set(item.provider_id, {
        id: item.provider_id,
        name: item.provider_name
      });
    }

    // Group by GPU model
    const gpuKey = item.gpu_model_id;
    if (!gpuGroups.has(gpuKey)) {
      gpuGroups.set(gpuKey, []);
    }
    gpuGroups.get(gpuKey)!.push(item);

    // Track price range
    const price = parseFloat(item.price_per_hour);
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
  });

  // Process each GPU group
  gpuGroups.forEach((items, gpuModelId) => {
    const firstItem = items[0];
    
    // Build GPU model
    const gpuModel: GPUModel = {
      id: firstItem.gpu_model_id,
      name: firstItem.gpu_model_name,
      manufacturer: firstItem.gpu_manufacturer,
      architecture: firstItem.gpu_architecture,
      vram: firstItem.gpu_vram,
      slug: firstItem.gpu_model_slug,
      created_at: '', // Not needed for comparison
      link: '', // Not needed for comparison
      use_case: firstItem.use_case,
      description: firstItem.description
    };

    // Build provider prices
    const providerPrices: ProviderPrice[] = items.map(item => ({
      provider: providers.get(item.provider_id)!,
      price_per_hour: parseFloat(item.price_per_hour),
      gpu_count: item.gpu_count,
      source_name: item.source_name,
      source_url: item.source_url,
      created_at: item.created_at
    }));

    // Calculate price differences
    const priceDifference = calculatePriceDifferences(providerPrices);

    // Build comparison
    const gpuComparison: GPUComparison = {
      gpuModel,
      providerPrices,
      priceDifference,
      availableProviderCount: providerPrices.length
    };

    gpuComparisons.set(gpuModelId, gpuComparison);
  });

  return {
    gpuComparisons,
    providers,
    metadata: {
      totalGPUs: gpuComparisons.size,
      totalProviders: providers.size,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice === -Infinity ? 0 : maxPrice
      }
    }
  };
}

/**
 * Calculates price differences between providers for a single GPU
 */
export function calculatePriceDifferences(providerPrices: ProviderPrice[]): PriceDifference | null {
  if (providerPrices.length < 2) {
    return null;
  }

  // Sort by price to find min/max
  const sortedPrices = [...providerPrices].sort((a, b) => a.price_per_hour - b.price_per_hour);
  const cheapest = sortedPrices[0];
  const mostExpensive = sortedPrices[sortedPrices.length - 1];

  const absolute = mostExpensive.price_per_hour - cheapest.price_per_hour;
  const percentage = cheapest.price_per_hour > 0 
    ? (absolute / cheapest.price_per_hour) * 100 
    : 0;

  return {
    absolute: parseFloat(absolute.toFixed(4)),
    percentage: parseFloat(percentage.toFixed(2)),
    cheapestProvider: cheapest.provider.name,
    mostExpensiveProvider: mostExpensive.provider.name,
    priceRange: {
      min: cheapest.price_per_hour,
      max: mostExpensive.price_per_hour
    }
  };
}

/**
 * Aggregates pricing data across multiple providers for analytics
 */
export function aggregatePricingData(comparisons: GPUComparison[]): {
  averagePriceDifference: number;
  medianPriceDifference: number;
  totalComparisons: number;
  availabilityStats: {
    gpusCoveredByAllProviders: number;
    gpusCoveredByMostProviders: number;
    averageProviderCount: number;
  };
} {
  const validComparisons = comparisons.filter(c => c.priceDifference !== null);
  
  if (validComparisons.length === 0) {
    return {
      averagePriceDifference: 0,
      medianPriceDifference: 0,
      totalComparisons: 0,
      availabilityStats: {
        gpusCoveredByAllProviders: 0,
        gpusCoveredByMostProviders: 0,
        averageProviderCount: 0
      }
    };
  }

  // Calculate price difference statistics
  const percentageDiffs = validComparisons.map(c => c.priceDifference!.percentage);
  const averagePriceDifference = percentageDiffs.reduce((sum, diff) => sum + diff, 0) / percentageDiffs.length;
  
  const sortedDiffs = [...percentageDiffs].sort((a, b) => a - b);
  const medianPriceDifference = sortedDiffs.length % 2 === 0
    ? (sortedDiffs[sortedDiffs.length / 2 - 1] + sortedDiffs[sortedDiffs.length / 2]) / 2
    : sortedDiffs[Math.floor(sortedDiffs.length / 2)];

  // Calculate availability statistics
  const maxProviders = Math.max(...comparisons.map(c => c.availableProviderCount));
  const gpusCoveredByAllProviders = comparisons.filter(c => c.availableProviderCount === maxProviders).length;
  const gpusCoveredByMostProviders = comparisons.filter(c => c.availableProviderCount >= Math.ceil(maxProviders * 0.8)).length;
  const averageProviderCount = comparisons.reduce((sum, c) => sum + c.availableProviderCount, 0) / comparisons.length;

  return {
    averagePriceDifference: parseFloat(averagePriceDifference.toFixed(2)),
    medianPriceDifference: parseFloat(medianPriceDifference.toFixed(2)),
    totalComparisons: validComparisons.length,
    availabilityStats: {
      gpusCoveredByAllProviders,
      gpusCoveredByMostProviders,
      averageProviderCount: parseFloat(averageProviderCount.toFixed(1))
    }
  };
}

/**
 * Sorts GPU comparisons based on the specified criteria
 */
export function sortGPUComparisons(
  comparisons: GPUComparison[], 
  sortBy: 'price' | 'name' | 'vram' | 'priceDifference', 
  sortOrder: 'asc' | 'desc' = 'asc'
): void {
  comparisons.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.gpuModel.name.localeCompare(b.gpuModel.name);
        break;
      case 'vram':
        comparison = a.gpuModel.vram - b.gpuModel.vram;
        break;
      case 'price':
        // Sort by minimum price across providers
        const minPriceA = Math.min(...a.providerPrices.map(p => p.price_per_hour));
        const minPriceB = Math.min(...b.providerPrices.map(p => p.price_per_hour));
        comparison = minPriceA - minPriceB;
        break;
      case 'priceDifference':
        // Sort by price difference percentage
        const diffA = a.priceDifference?.percentage || 0;
        const diffB = b.priceDifference?.percentage || 0;
        comparison = diffA - diffB;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filters GPU comparisons based on availability across providers
 */
export function filterByAvailability(
  comparisons: GPUComparison[],
  minProviderCount: number = 2
): GPUComparison[] {
  return comparisons.filter(comparison => 
    comparison.availableProviderCount >= minProviderCount
  );
}

/**
 * Gets price distribution statistics for a set of comparisons
 */
export function getPriceDistributionStats(comparisons: GPUComparison[]): {
  priceRanges: { range: string; count: number }[];
  averagePrice: number;
  medianPrice: number;
  priceVariance: number;
} {
  const allPrices = comparisons.flatMap(c => c.providerPrices.map(p => p.price_per_hour));
  
  if (allPrices.length === 0) {
    return {
      priceRanges: [],
      averagePrice: 0,
      medianPrice: 0,
      priceVariance: 0
    };
  }

  // Calculate basic statistics
  const sortedPrices = [...allPrices].sort((a, b) => a - b);
  const averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
    : sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Calculate variance
  const priceVariance = allPrices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / allPrices.length;

  // Create price ranges
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const rangeSize = (maxPrice - minPrice) / 5; // 5 ranges

  const priceRanges = [];
  for (let i = 0; i < 5; i++) {
    const rangeStart = minPrice + (i * rangeSize);
    const rangeEnd = i === 4 ? maxPrice : rangeStart + rangeSize;
    const count = allPrices.filter(price => price >= rangeStart && price <= rangeEnd).length;
    
    priceRanges.push({
      range: `$${rangeStart.toFixed(2)} - $${rangeEnd.toFixed(2)}`,
      count
    });
  }

  return {
    priceRanges,
    averagePrice: parseFloat(averagePrice.toFixed(4)),
    medianPrice: parseFloat(medianPrice.toFixed(4)),
    priceVariance: parseFloat(priceVariance.toFixed(4))
  };
}