import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel, findMatchingGPUModelWithVRAM } from '@/lib/utils/gpu-scraping';
import { scrapeProviderPricing, isFirecrawlConfigured, ExtractedGPU } from '@/lib/utils/firecrawl';
import { notifyFirecrawlFailure, notifyScraperFallbackFailure } from '@/lib/utils/discord';

// Providers that have dedicated API integrations (skip Firecrawl for these)
const API_PROVIDERS = ['lambda', 'shadeform', 'runpod'];

interface Provider {
  id: string;
  name: string;
  slug: string;
  pricing_page: string | null;
}

interface GPUModel {
  id: string;
  name: string;
  vram: number | null;
}

interface ProviderResult {
  provider: string;
  slug: string;
  method: 'firecrawl' | 'fallback' | 'skipped';
  success: boolean;
  matched: number;
  unmatched: number;
  error?: string;
  pricesInserted: number;
}

interface ScrapeLogEntry {
  provider_id: string;
  provider_name: string;
  method: string;
  success: boolean;
  matched_count: number;
  unmatched_count: number;
  error_message: string | null;
  source_url: string | null;
}

async function logScrapeResult(entry: ScrapeLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('scrape_logs').insert({
      provider_id: entry.provider_id,
      provider_name: entry.provider_name,
      method: entry.method,
      success: entry.success,
      matched_count: entry.matched_count,
      unmatched_count: entry.unmatched_count,
      error_message: entry.error_message,
      source_url: entry.source_url,
    });

    if (error) {
      console.error('Failed to log scrape result to database:', error.message, error.details);
    } else {
      console.log(`  📝 Logged scrape result for ${entry.provider_name} (${entry.method}, success: ${entry.success})`);
    }
  } catch (error) {
    console.error('Failed to log scrape result:', error);
  }
}

async function insertPrices(
  providerId: string,
  matchResults: Array<{
    gpu_model_id: string;
    price: number;
    gpu_count: number;
    matched_name: string;
  }>,
  sourceUrl: string,
  sourceName: string
): Promise<number> {
  let inserted = 0;

  for (const result of matchResults) {
    const { error: priceError } = await supabaseAdmin.from('prices').insert({
      provider_id: providerId,
      gpu_model_id: result.gpu_model_id,
      price_per_hour: result.price,
      gpu_count: result.gpu_count,
      source_name: sourceName,
      source_url: sourceUrl,
    });

    if (priceError) {
      console.error(`Error inserting price for ${result.matched_name}:`, priceError);
    } else {
      inserted++;
    }
  }

  return inserted;
}

async function processFirecrawlResults(
  providerId: string,
  providerName: string,
  gpus: ExtractedGPU[],
  existingModels: GPUModel[],
  sourceUrl: string
): Promise<{ matched: number; unmatched: number; inserted: number }> {
  const matchResults: Array<{
    gpu_model_id: string;
    price: number;
    gpu_count: number;
    matched_name: string;
    scraped_name: string;
  }> = [];
  const unmatchedGPUs: ExtractedGPU[] = [];

  for (const gpu of gpus) {
    let matchingModel: GPUModel | null | undefined;

    // Try matching with VRAM if available
    if (gpu.vram_gb) {
      matchingModel = await findMatchingGPUModelWithVRAM(
        gpu.gpu_name,
        gpu.vram_gb,
        existingModels
      );
    } else {
      matchingModel = await findMatchingGPUModel(gpu.gpu_name, existingModels);
    }

    if (matchingModel) {
      matchResults.push({
        gpu_model_id: matchingModel.id,
        price: gpu.price_per_hour,
        gpu_count: gpu.gpu_count || 1,
        matched_name: matchingModel.name,
        scraped_name: gpu.gpu_name,
      });
      console.log(`  ✅ Matched: ${gpu.gpu_name} → ${matchingModel.name}`);
    } else {
      unmatchedGPUs.push(gpu);
      console.log(`  ❌ Unmatched: ${gpu.gpu_name}`);
    }
  }

  const inserted = await insertPrices(
    providerId,
    matchResults,
    sourceUrl,
    `Firecrawl - ${providerName}`
  );

  return {
    matched: matchResults.length,
    unmatched: unmatchedGPUs.length,
    inserted,
  };
}

async function tryFallbackScraper(
  provider: Provider,
  baseUrl: string
): Promise<{ success: boolean; status?: number; data?: Record<string, unknown> }> {
  const scraperUrl = `${baseUrl}/api/cron/${provider.slug}`;

  try {
    console.log(`  🔄 Trying fallback scraper: ${scraperUrl}`);

    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return { success: false, status: 404 };
    }

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const data = await response.json();
    return { success: data.success === true, data };
  } catch (error) {
    console.error(`  Fallback scraper error for ${provider.slug}:`, error);
    return { success: false };
  }
}

async function processProvider(
  provider: Provider,
  existingModels: GPUModel[],
  baseUrl: string
): Promise<ProviderResult> {
  // Skip providers with dedicated API integrations
  if (API_PROVIDERS.includes(provider.slug)) {
    console.log(`⏭️ Skipping ${provider.name} (has dedicated API integration)`);
    return {
      provider: provider.name,
      slug: provider.slug,
      method: 'skipped',
      success: true,
      matched: 0,
      unmatched: 0,
      pricesInserted: 0,
    };
  }

  if (!provider.pricing_page) {
    console.log(`⏭️ Skipping ${provider.name} (no pricing page URL)`);
    return {
      provider: provider.name,
      slug: provider.slug,
      method: 'skipped',
      success: true,
      matched: 0,
      unmatched: 0,
      error: 'No pricing page URL configured',
      pricesInserted: 0,
    };
  }

  console.log(`\n📊 Processing ${provider.name}...`);

  // Try Firecrawl first
  const firecrawlResult = await scrapeProviderPricing(
    provider.pricing_page,
    provider.name
  );

  if (firecrawlResult.success && firecrawlResult.gpus.length > 0) {
    // Firecrawl succeeded - process results
    const { matched, unmatched, inserted } = await processFirecrawlResults(
      provider.id,
      provider.name,
      firecrawlResult.gpus,
      existingModels,
      provider.pricing_page
    );

    await logScrapeResult({
      provider_id: provider.id,
      provider_name: provider.name,
      method: 'firecrawl',
      success: true,
      matched_count: matched,
      unmatched_count: unmatched,
      error_message: null,
      source_url: provider.pricing_page,
    });

    return {
      provider: provider.name,
      slug: provider.slug,
      method: 'firecrawl',
      success: true,
      matched,
      unmatched,
      pricesInserted: inserted,
    };
  }

  // Firecrawl failed - notify and try fallback
  console.log(`  ⚠️ Firecrawl failed for ${provider.name}: ${firecrawlResult.error}`);

  await notifyFirecrawlFailure(
    provider.name,
    provider.pricing_page,
    firecrawlResult.error || 'Unknown error'
  );

  await logScrapeResult({
    provider_id: provider.id,
    provider_name: provider.name,
    method: 'firecrawl',
    success: false,
    matched_count: 0,
    unmatched_count: 0,
    error_message: firecrawlResult.error || 'Unknown error',
    source_url: provider.pricing_page,
  });

  // Try fallback scraper
  const fallbackResult = await tryFallbackScraper(provider, baseUrl);

  if (fallbackResult.status === 404) {
    // No fallback scraper exists - notify
    console.log(`  ❌ No fallback scraper found for ${provider.slug}`);

    await notifyScraperFallbackFailure(provider.name, provider.slug);

    await logScrapeResult({
      provider_id: provider.id,
      provider_name: provider.name,
      method: 'fallback',
      success: false,
      matched_count: 0,
      unmatched_count: 0,
      error_message: `No scraper route found at /api/cron/${provider.slug}`,
      source_url: null,
    });

    return {
      provider: provider.name,
      slug: provider.slug,
      method: 'fallback',
      success: false,
      matched: 0,
      unmatched: 0,
      error: `Firecrawl failed and no fallback scraper at /api/cron/${provider.slug}`,
      pricesInserted: 0,
    };
  }

  if (fallbackResult.success) {
    // Fallback succeeded
    console.log(`  ✅ Fallback scraper succeeded for ${provider.name}`);

    const data = fallbackResult.data as {
      matched?: number;
      unmatched?: number;
    } | undefined;

    await logScrapeResult({
      provider_id: provider.id,
      provider_name: provider.name,
      method: 'fallback',
      success: true,
      matched_count: data?.matched || 0,
      unmatched_count: data?.unmatched || 0,
      error_message: null,
      source_url: provider.pricing_page,
    });

    return {
      provider: provider.name,
      slug: provider.slug,
      method: 'fallback',
      success: true,
      matched: data?.matched || 0,
      unmatched: data?.unmatched || 0,
      pricesInserted: data?.matched || 0,
    };
  }

  // Fallback also failed
  console.log(`  ❌ Fallback scraper failed for ${provider.name}`);

  await logScrapeResult({
    provider_id: provider.id,
    provider_name: provider.name,
    method: 'fallback',
    success: false,
    matched_count: 0,
    unmatched_count: 0,
    error_message: `Fallback scraper returned status ${fallbackResult.status}`,
    source_url: null,
  });

  return {
    provider: provider.name,
    slug: provider.slug,
    method: 'fallback',
    success: false,
    matched: 0,
    unmatched: 0,
    error: 'Both Firecrawl and fallback scraper failed',
    pricesInserted: 0,
  };
}

async function getNextProviderInRotation(
  eligibleProviders: Provider[]
): Promise<{ provider: Provider; index: number; total: number }> {
  // Sort providers by slug for consistent ordering
  const sortedProviders = [...eligibleProviders].sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );

  // Get the most recent firecrawl scrape log
  const { data: lastScrape, error: queryError } = await supabaseAdmin
    .from('scrape_logs')
    .select('provider_id, provider_name')
    .eq('method', 'firecrawl')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextIndex = 0;

  if (queryError && queryError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is expected for empty table
    console.error('Error querying scrape_logs for rotation:', queryError.message);
  }

  if (lastScrape) {
    console.log(`  📋 Last firecrawl scrape was for: ${lastScrape.provider_name}`);

    // Find the last scraped provider in our sorted list
    const lastIndex = sortedProviders.findIndex(
      (p) => p.id === lastScrape.provider_id
    );

    if (lastIndex !== -1) {
      // Move to next provider, wrap around if at end
      nextIndex = (lastIndex + 1) % sortedProviders.length;
    } else {
      console.log(`  ⚠️ Last provider ${lastScrape.provider_name} not found in eligible list, starting from beginning`);
    }
  } else {
    console.log('  📋 No previous firecrawl scrape found, starting from beginning');
  }

  return {
    provider: sortedProviders[nextIndex],
    index: nextIndex,
    total: sortedProviders.length,
  };
}

export async function GET(request: Request) {
  const startTime = Date.now();

  // Check if Firecrawl is configured
  if (!isFirecrawlConfigured()) {
    return NextResponse.json(
      { success: false, error: 'FIRECRAWL_API_KEY not configured' },
      { status: 500 }
    );
  }

  // Get base URL for fallback scraper calls
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const providerSlug = url.searchParams.get('provider');

  try {
    // Fetch all providers with pricing pages
    const { data: allProviders, error: providersError } = await supabaseAdmin
      .from('providers')
      .select('id, name, slug, pricing_page')
      .not('pricing_page', 'is', null);

    if (providersError) {
      throw new Error(`Error fetching providers: ${providersError.message}`);
    }

    // Filter to eligible providers (have pricing page, not API-based)
    const eligibleProviders = (allProviders || []).filter(
      (p: Provider) => !API_PROVIDERS.includes(p.slug) && p.pricing_page
    ) as Provider[];

    if (eligibleProviders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible providers found for Firecrawl scraping',
      });
    }

    let provider: Provider;
    let rotationInfo: { index: number; total: number } | null = null;

    if (providerSlug) {
      // Specific provider requested
      const found = eligibleProviders.find((p) => p.slug === providerSlug);

      if (!found) {
        return NextResponse.json(
          {
            success: false,
            error: `Provider '${providerSlug}' not found or not eligible`,
            availableProviders: eligibleProviders.map((p) => p.slug),
          },
          { status: 404 }
        );
      }

      provider = found;
    } else {
      // Auto-rotate: pick the next provider in sequence
      const rotation = await getNextProviderInRotation(eligibleProviders);
      provider = rotation.provider;
      rotationInfo = { index: rotation.index, total: rotation.total };

      console.log(
        `🔄 Auto-rotation: selected ${provider.name} (${rotation.index + 1}/${rotation.total})`
      );
    }

    console.log(`🔥 Starting Firecrawl pricing scrape for ${provider.name}...`);

    // Fetch existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('id, name, vram');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Process the provider
    const result = await processProvider(
      provider,
      existingModels as GPUModel[],
      baseUrl
    );

    const duration = Date.now() - startTime;

    console.log(
      `\n🏁 Firecrawl scrape for ${provider.name} completed in ${duration}ms`
    );

    return NextResponse.json({
      success: result.success,
      duration_ms: duration,
      ...(rotationInfo && {
        rotation: {
          current: rotationInfo.index + 1,
          total: rotationInfo.total,
          nextRunWillProcess:
            eligibleProviders.sort((a, b) => a.slug.localeCompare(b.slug))[
              (rotationInfo.index + 1) % rotationInfo.total
            ]?.name,
        },
      }),
      result,
    });
  } catch (error) {
    console.error('Firecrawl cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
