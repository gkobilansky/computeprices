/**
 * Tests for Firecrawl scraping utility
 *
 * These tests verify error handling and edge cases.
 * Actual Firecrawl API integration is tested with real credentials.
 */

import { scrapeProviderPricing, isFirecrawlConfigured, FirecrawlScrapeResult } from '../../../lib/utils/firecrawl';

describe('Firecrawl Scraping Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isFirecrawlConfigured', () => {
    test('should return false when FIRECRAWL_API_KEY is not set', () => {
      console.log('Testing: isFirecrawlConfigured without API key');
      delete process.env.FIRECRAWL_API_KEY;

      const result = isFirecrawlConfigured();

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should return false when FIRECRAWL_API_KEY is empty', () => {
      console.log('Testing: isFirecrawlConfigured with empty API key');
      process.env.FIRECRAWL_API_KEY = '';

      const result = isFirecrawlConfigured();

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should return true when FIRECRAWL_API_KEY is set', () => {
      console.log('Testing: isFirecrawlConfigured with valid API key');
      process.env.FIRECRAWL_API_KEY = 'fc-test-key';

      const result = isFirecrawlConfigured();

      console.log('Result:', result);
      expect(result).toBe(true);
    });
  });

  describe('scrapeProviderPricing', () => {
    test('should return error when FIRECRAWL_API_KEY is not set', async () => {
      console.log('Testing: scrapeProviderPricing without API key');
      delete process.env.FIRECRAWL_API_KEY;

      const result = await scrapeProviderPricing(
        'https://example.com/pricing',
        'Test Provider'
      );

      console.log('Result:', JSON.stringify(result, null, 2));
      expect(result.success).toBe(false);
      expect(result.error).toContain('FIRECRAWL_API_KEY');
      expect(result.gpus).toEqual([]);
      expect(result.sourceUrl).toBe('https://example.com/pricing');
    });

    test('should include provider name in error logging', async () => {
      console.log('Testing: scrapeProviderPricing error includes provider name');
      delete process.env.FIRECRAWL_API_KEY;

      const consoleSpy = jest.spyOn(console, 'error');

      await scrapeProviderPricing(
        'https://hyperstack.cloud/gpu-pricing',
        'Hyperstack'
      );

      expect(consoleSpy).toHaveBeenCalled();
      const errorCall = consoleSpy.mock.calls.find(call =>
        call[0].includes('Hyperstack')
      );
      console.log('Error log found:', errorCall);
      expect(errorCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    test('should return source URL in result', async () => {
      console.log('Testing: scrapeProviderPricing returns source URL');
      delete process.env.FIRECRAWL_API_KEY;

      const testUrl = 'https://coreweave.com/gpu-cloud-pricing';
      const result = await scrapeProviderPricing(testUrl, 'CoreWeave');

      console.log('Source URL in result:', result.sourceUrl);
      expect(result.sourceUrl).toBe(testUrl);
    });
  });

  describe('FirecrawlScrapeResult structure', () => {
    test('should have correct structure for failure result', async () => {
      console.log('Testing: FirecrawlScrapeResult failure structure');
      delete process.env.FIRECRAWL_API_KEY;

      const result: FirecrawlScrapeResult = await scrapeProviderPricing(
        'https://example.com',
        'Test'
      );

      console.log('Result structure:', Object.keys(result));
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('gpus');
      expect(result).toHaveProperty('sourceUrl');
      expect(result).toHaveProperty('error');
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.gpus)).toBe(true);
      expect(typeof result.sourceUrl).toBe('string');
    });
  });
});
