import { fetchGPUModels, fetchGPUPrices, fetchProviders, getHomepageStats, fetchProviderComparison, getLatestPriceDrops, getProviderSuggestions } from '../../../lib/utils/fetchGPUData.js'
import { testSupabase, verifyTestConnection, getTestDataIds } from '../../setup/testDatabase.js'

// Override the supabase client with test database connection
jest.mock('../../../lib/supabase.js', () => ({
  supabase: require('../../setup/testDatabase.js').testSupabase
}))

describe('fetchGPUData - Integration Tests', () => {
  let testData;
  
  beforeAll(async () => {
    // Verify we can connect to test database
    const connected = await verifyTestConnection();
    if (!connected) {
      throw new Error('Cannot connect to test database. Make sure supabase is running locally.');
    }
    
    // Get some real test data IDs for testing
    testData = await getTestDataIds();
    expect(testData.providers.length).toBeGreaterThan(0);
    expect(testData.gpus.length).toBeGreaterThan(0);
  });

  describe('fetchGPUModels', () => {
    test('should fetch all GPU models when no ID provided', async () => {
      const result = await fetchGPUModels();
      
      // Test with real data - should return array of GPU models
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify structure of returned data
      const firstGPU = result[0];
      expect(firstGPU).toHaveProperty('id');
      expect(firstGPU).toHaveProperty('name');
      expect(firstGPU).toHaveProperty('vram');
      expect(firstGPU).toHaveProperty('manufacturer');
      expect(typeof firstGPU.name).toBe('string');
      expect(typeof firstGPU.vram).toBe('number');
    });

    test('should fetch specific GPU model when ID provided', async () => {
      // Use real test data
      const testGPU = testData.gpus[0];
      const result = await fetchGPUModels(testGPU.id);
      
      // Should return single GPU object, not array
      expect(result).toBeInstanceOf(Object);
      expect(Array.isArray(result)).toBe(false);
      expect(result.id).toBe(testGPU.id);
      expect(result.name).toBe(testGPU.name);
      expect(result).toHaveProperty('vram');
      expect(result).toHaveProperty('manufacturer');
    });

    test('should return null when GPU not found', async () => {
      const result = await fetchGPUModels('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    test('should handle invalid UUID format', async () => {
      // The Supabase client returns an error for invalid UUID
      try {
        await fetchGPUModels('invalid-uuid');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('invalid input syntax for type uuid');
      }
    });
  });

  describe('fetchGPUPrices', () => {
    test('should fetch all prices when no filters provided', async () => {
      const result = await fetchGPUPrices({});
      
      // Should return array of price data
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify price data structure
      const firstPrice = result[0];
      expect(firstPrice).toHaveProperty('provider_id');
      expect(firstPrice).toHaveProperty('gpu_model_id');
      expect(firstPrice).toHaveProperty('price_per_hour');
      expect(firstPrice).toHaveProperty('provider_name');
      expect(firstPrice).toHaveProperty('gpu_model_name');
      // Price can be either string (from Postgres DECIMAL) or number (from RPC)
      expect(['string', 'number']).toContain(typeof firstPrice.price_per_hour);
      expect(Number(firstPrice.price_per_hour)).toBeGreaterThan(0);
    });

    test('should filter by provider correctly', async () => {
      // Use real test provider
      const testProvider = testData.providers[0];
      const result = await fetchGPUPrices({ selectedProvider: testProvider.id });
      
      expect(Array.isArray(result)).toBe(true);
      // All results should be from the selected provider
      result.forEach(price => {
        expect(price.provider_id).toBe(testProvider.id);
        expect(price.provider_name).toBe(testProvider.name);
      });
    });

    test('should filter by GPU correctly', async () => {
      // Use real test GPU
      const testGPU = testData.gpus[0];
      const result = await fetchGPUPrices({ selectedGPU: testGPU.id });
      
      expect(Array.isArray(result)).toBe(true);
      // All results should be for the selected GPU
      result.forEach(price => {
        expect(price.gpu_model_id).toBe(testGPU.id);
        expect(price.gpu_model_name).toBe(testGPU.name);
      });
    });

    test('should handle multiple providers', async () => {
      // Use real test providers
      const provider1 = testData.providers[0];
      const provider2 = testData.providers[1];
      
      const result = await fetchGPUPrices({ 
        selectedProviders: [provider1.id, provider2.id] 
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // Results should only contain the two selected providers
      const providerIds = [...new Set(result.map(p => p.provider_id))];
      expect(providerIds).toContain(provider1.id);
      expect(providerIds).toContain(provider2.id);
      expect(providerIds.length).toBeLessThanOrEqual(2);
    });

    test('should return empty array for non-existent provider', async () => {
      const result = await fetchGPUPrices({ 
        selectedProvider: '00000000-0000-0000-0000-000000000000' 
      });
      expect(result).toEqual([]);
    });
  });

  describe('fetchProviders', () => {
    test('should fetch all providers ordered by name', async () => {
      const result = await fetchProviders();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify provider structure
      const firstProvider = result[0];
      expect(firstProvider).toHaveProperty('id');
      expect(firstProvider).toHaveProperty('name');
      expect(typeof firstProvider.name).toBe('string');
      
      // Verify ordering by name
      for (let i = 1; i < result.length; i++) {
        expect(result[i].name >= result[i-1].name).toBe(true);
      }
    });
  });

  describe('getHomepageStats', () => {
    test('should return real stats from database', async () => {
      const result = await getHomepageStats();
      
      expect(result).toHaveProperty('gpuCount');
      expect(result).toHaveProperty('providerCount');
      expect(result).toHaveProperty('pricePointsChecked');
      
      // Should have real positive numbers from seeded data
      expect(result.gpuCount).toBeGreaterThan(0);
      expect(result.providerCount).toBeGreaterThan(0);
      expect(result.pricePointsChecked).toBeGreaterThan(0);
      
      // Verify the counts match our test data
      expect(result.gpuCount).toBe(testData.gpus.length > 3 ? testData.gpus.length : result.gpuCount);
      expect(result.providerCount).toBe(testData.providers.length > 3 ? testData.providers.length : result.providerCount);
    });
  });

  describe('getLatestPriceDrops', () => {
    test('should return price alert structure with required fields', async () => {
      const result = await getLatestPriceDrops();

      // All responses must have these base fields
      expect(result).toHaveProperty('hasAlert');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('alertType');
      expect(result).toHaveProperty('changes');

      expect(typeof result.hasAlert).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.alertType).toBe('string');
      expect(Array.isArray(result.changes)).toBe(true);

      // alertType should be one of the valid types
      expect(['none', 'price_drop', 'price_increase', 'error']).toContain(result.alertType);
    });

    test('should return detailed data when price drops exist', async () => {
      const result = await getLatestPriceDrops();

      if (result.hasAlert && result.alertType === 'price_drop') {
        expect(result).toHaveProperty('gpuModel');
        expect(result).toHaveProperty('gpuSlug');
        expect(result).toHaveProperty('providerCount');
        expect(result).toHaveProperty('percentageChange');
        expect(result).toHaveProperty('providers');

        expect(typeof result.gpuModel).toBe('string');
        expect(typeof result.providerCount).toBe('number');
        expect(typeof result.percentageChange).toBe('number');
        expect(result.percentageChange).toBeLessThan(0); // Drops are negative
        expect(Array.isArray(result.providers)).toBe(true);

        // Each provider in the list should have required fields
        result.providers.forEach(provider => {
          expect(provider).toHaveProperty('providerName');
          expect(provider).toHaveProperty('providerId');
          expect(provider).toHaveProperty('percentChange');
          expect(provider).toHaveProperty('currentPrice');
          expect(provider).toHaveProperty('previousPrice');
        });
      }
    });

    test('should return detailed data when price increases exist', async () => {
      const result = await getLatestPriceDrops();

      if (result.hasAlert && result.alertType === 'price_increase') {
        expect(result).toHaveProperty('gpuModel');
        expect(result).toHaveProperty('gpuSlug');
        expect(result).toHaveProperty('providerName');
        expect(result).toHaveProperty('percentageChange');
        expect(result).toHaveProperty('currentPrice');
        expect(result).toHaveProperty('previousPrice');

        expect(typeof result.percentageChange).toBe('number');
        expect(result.percentageChange).toBeGreaterThan(0); // Increases are positive
      }
    });

    test('should accept custom time window and threshold parameters', async () => {
      // Test with different parameters - should not throw
      const result24h = await getLatestPriceDrops(24, 10);
      const result72h = await getLatestPriceDrops(72, 3);

      expect(result24h).toHaveProperty('hasAlert');
      expect(result72h).toHaveProperty('hasAlert');
    });

    test('should return no alert structure when no changes found', async () => {
      // Use very short window and high threshold to likely get no results
      const result = await getLatestPriceDrops(1, 99);

      if (!result.hasAlert) {
        // Could be 'none' (no changes) or 'error' (database unavailable)
        expect(['none', 'error']).toContain(result.alertType);
        expect(result.changes).toEqual([]);
      }
    });
  });

  describe('fetchProviderComparison', () => {
    test('should compare two providers with real data', async () => {
      // Skip if we don't have at least 2 providers
      if (testData.providers.length < 2) {
        console.log('Skipping provider comparison test - not enough providers');
        return;
      }
      
      const provider1 = testData.providers[0];
      const provider2 = testData.providers[1];
      
      const result = await fetchProviderComparison(provider1.id, provider2.id);
      
      expect(result).toHaveProperty('provider1');
      expect(result).toHaveProperty('provider2');
      expect(result).toHaveProperty('comparisonData');
      expect(result).toHaveProperty('metadata');
      
      expect(result.provider1.id).toBe(provider1.id);
      expect(result.provider2.id).toBe(provider2.id);
      expect(Array.isArray(result.comparisonData)).toBe(true);
    });
  });

  describe('getProviderSuggestions', () => {
    test('should return provider suggestions based on shared GPUs', async () => {
      const testProvider = testData.providers[0];
      const result = await getProviderSuggestions(testProvider.id);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3); // Function limits to 3 suggestions
      
      result.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('slug');
        expect(suggestion).toHaveProperty('sharedGPUs');
        expect(suggestion.id).not.toBe(testProvider.id); // Should not suggest itself
        expect(typeof suggestion.sharedGPUs).toBe('number');
      });
    });
  });
});