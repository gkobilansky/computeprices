/**
 * Tests for Slack notification utility
 *
 * These tests focus on message formatting and edge cases.
 * Actual webhook delivery is tested manually with a real webhook URL.
 */

import { sendSlackAlert, notifyFirecrawlFailure, notifyScraperFallbackFailure, notifyScrapingSuccess } from '../../../lib/utils/slack';

describe('Slack Notification Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendSlackAlert', () => {
    test('should return false when SLACK_WEBHOOK_URL is not configured', async () => {
      console.log('Testing: sendSlackAlert without webhook URL');
      delete process.env.SLACK_WEBHOOK_URL;

      const result = await sendSlackAlert({
        type: 'info',
        provider: 'Test Provider',
        error: 'Test error',
      });

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should return false when SLACK_WEBHOOK_URL is empty string', async () => {
      console.log('Testing: sendSlackAlert with empty webhook URL');
      process.env.SLACK_WEBHOOK_URL = '';

      const result = await sendSlackAlert({
        type: 'firecrawl_failure',
        provider: 'Test Provider',
      });

      console.log('Result:', result);
      expect(result).toBe(false);
    });

    test('should handle all alert types without throwing', async () => {
      console.log('Testing: sendSlackAlert handles all alert types');
      delete process.env.SLACK_WEBHOOK_URL;

      const types = ['firecrawl_failure', 'scraper_fallback_failure', 'scraper_success', 'info'] as const;

      for (const type of types) {
        console.log(`Testing alert type: ${type}`);
        const result = await sendSlackAlert({
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
      delete process.env.SLACK_WEBHOOK_URL;

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
      delete process.env.SLACK_WEBHOOK_URL;

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
      delete process.env.SLACK_WEBHOOK_URL;

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
      delete process.env.SLACK_WEBHOOK_URL;

      const result = await notifyScrapingSuccess([]);

      console.log('Result:', result);
      expect(result).toBe(false);
    });
  });
});
