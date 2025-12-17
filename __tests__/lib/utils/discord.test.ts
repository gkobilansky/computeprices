/**
 * Tests for Discord notification utility
 *
 * These tests focus on message formatting and edge cases.
 * Actual webhook delivery is tested manually with a real webhook URL.
 */

import { sendDiscordAlert, notifyFirecrawlFailure, notifyScraperFallbackFailure, notifyScrapingSuccess } from '../../../lib/utils/discord';

describe('Discord Notification Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendDiscordAlert', () => {
    test('should return false when DISCORD_WEBHOOK_URL is not configured', async () => {
      console.log('Testing: sendDiscordAlert without webhook URL');
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await sendDiscordAlert({
        type: 'info',
        provider: 'Test Provider',
        error: 'Test error',
      });

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should return false when DISCORD_WEBHOOK_URL is empty string', async () => {
      console.log('Testing: sendDiscordAlert with empty webhook URL');
      process.env.DISCORD_WEBHOOK_URL = '';

      const result = await sendDiscordAlert({
        type: 'firecrawl_failure',
        provider: 'Test Provider',
      });

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should handle all alert types without throwing', async () => {
      console.log('Testing: sendDiscordAlert handles all alert types');
      delete process.env.DISCORD_WEBHOOK_URL;

      const types = ['firecrawl_failure', 'scraper_fallback_failure', 'scraper_success', 'info'] as const;

      for (const type of types) {
        console.log(`Testing alert type: ${type}`);
        const result = await sendDiscordAlert({
          type,
          provider: 'Test Provider',
          url: 'https://example.com',
          error: 'Test error',
          details: { key: 'value' },
        });

        // Should return false because no webhook URL is set
        expect(result).toBe(false);
        console.log(`Alert type ${type} handled correctly`);
      }
    });
  });

  describe('notifyFirecrawlFailure', () => {
    test('should handle Firecrawl failure notification', async () => {
      console.log('Testing: notifyFirecrawlFailure');
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await notifyFirecrawlFailure(
        'CoreWeave',
        'https://coreweave.com/gpu-cloud-pricing',
        'Timeout after 60 seconds'
      );

      console.log('Result:', result);
      expect(result).toBe(false); // No webhook configured
    });
  });

  describe('notifyScraperFallbackFailure', () => {
    test('should handle fallback scraper not found notification', async () => {
      console.log('Testing: notifyScraperFallbackFailure');
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await notifyScraperFallbackFailure(
        'TensorWave',
        'tensorwave'
      );

      console.log('Result:', result);
      expect(result).toBe(false); // No webhook configured
    });
  });

  describe('notifyScrapingSuccess', () => {
    test('should handle scraping success notification', async () => {
      console.log('Testing: notifyScrapingSuccess');
      delete process.env.DISCORD_WEBHOOK_URL;

      const results = [
        { provider: 'CoreWeave', method: 'firecrawl', matched: 10, unmatched: 2 },
        { provider: 'Hyperstack', method: 'fallback', matched: 8, unmatched: 1 },
        { provider: 'Lambda Labs', method: 'api', matched: 5, unmatched: 0 },
      ];

      const result = await notifyScrapingSuccess(results);

      console.log('Result:', result);
      expect(result).toBe(false); // No webhook configured
    });

    test('should handle empty results array', async () => {
      console.log('Testing: notifyScrapingSuccess with empty array');
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await notifyScrapingSuccess([]);

      console.log('Result:', result);
      expect(result).toBe(false);
    });
  });
});
