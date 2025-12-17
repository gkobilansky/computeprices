/**
 * Firecrawl utility for automated pricing page scraping
 */

import Firecrawl from '@mendable/firecrawl-js';

// Schema for GPU pricing extraction - matches prices table structure
const GPU_PRICING_SCHEMA = {
  type: 'object',
  properties: {
    gpus: {
      type: 'array',
      description: 'Array of GPU offerings with pricing information',
      items: {
        type: 'object',
        properties: {
          gpu_name: {
            type: 'string',
            description: 'The GPU model name (e.g., "NVIDIA A100", "H100 SXM", "RTX 4090")',
          },
          price_per_hour: {
            type: 'number',
            description: 'The price per hour in USD for renting this GPU',
          },
          gpu_count: {
            type: 'number',
            description: 'Number of GPUs included in this offering (default 1)',
          },
          vram_gb: {
            type: 'number',
            description: 'GPU memory in gigabytes if specified',
          },
          instance_type: {
            type: 'string',
            description: 'The instance or configuration name if applicable',
          },
        },
        required: ['gpu_name', 'price_per_hour'],
      },
    },
  },
  required: ['gpus'],
};

export interface ExtractedGPU {
  gpu_name: string;
  price_per_hour: number;
  gpu_count?: number;
  vram_gb?: number;
  instance_type?: string;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  gpus: ExtractedGPU[];
  error?: string;
  sourceUrl: string;
}

let firecrawlClient: Firecrawl | null = null;

function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
    firecrawlClient = new Firecrawl({ apiKey });
  }
  return firecrawlClient;
}

/**
 * Scrape a pricing page using Firecrawl and extract GPU pricing data
 *
 * Note: The Firecrawl SDK returns the data object directly (not wrapped in a success object).
 * Errors are thrown as exceptions.
 */
export async function scrapeProviderPricing(
  url: string,
  providerName: string
): Promise<FirecrawlScrapeResult> {
  try {
    const client = getFirecrawlClient();

    console.log(`🔥 Firecrawl: Scraping ${providerName} at ${url}`);

    // SDK returns data directly or throws on error
    const result = await client.scrape(url, {
      formats: [
        {
          type: 'json',
          schema: GPU_PRICING_SCHEMA,
        },
      ],
      // Force fresh content, don't use cache for pricing data
      maxAge: 0,
      timeout: 60000,
    });

    // SDK returns data object directly - check if we got valid data
    if (!result) {
      return {
        success: false,
        gpus: [],
        error: 'Firecrawl scrape failed - no response',
        sourceUrl: url,
      };
    }

    // Extract the JSON data from the result
    // The SDK returns { json: {...}, markdown: "...", metadata: {...} }
    const jsonData = result.json as { gpus?: ExtractedGPU[] } | undefined;

    if (!jsonData || !jsonData.gpus || !Array.isArray(jsonData.gpus)) {
      return {
        success: false,
        gpus: [],
        error: 'No GPU pricing data extracted from page',
        sourceUrl: url,
      };
    }

    // Filter out invalid entries
    const validGpus = jsonData.gpus.filter(
      (gpu) =>
        gpu.gpu_name &&
        typeof gpu.price_per_hour === 'number' &&
        gpu.price_per_hour > 0
    );

    if (validGpus.length === 0) {
      return {
        success: false,
        gpus: [],
        error: 'No valid GPU pricing entries found after filtering',
        sourceUrl: url,
      };
    }

    console.log(`🔥 Firecrawl: Extracted ${validGpus.length} GPU prices from ${providerName}`);

    return {
      success: true,
      gpus: validGpus,
      sourceUrl: url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`🔥 Firecrawl error for ${providerName}:`, errorMessage);

    return {
      success: false,
      gpus: [],
      error: errorMessage,
      sourceUrl: url,
    };
  }
}

/**
 * Check if Firecrawl is configured and available
 */
export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}
