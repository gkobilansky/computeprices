import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getSafeBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

interface ScrapedGPU {
  name: string;
  instanceName: string;
  gpuCount: number;
  vram: number;
  price: number;
}

interface MatchResult {
  instanceName: string;
  gpuName: string;
  matchedModel: string;
  price: number;
  vram: number;
  gpuCount: number;
}

export async function GET(request: Request) {
  let browser: BrowserInstance | null = null;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting DataCrunch GPU scraper...');

    const config = await getSafeBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;
    
    const page = await browser.newPage();

    await page.goto('https://datacrunch.io/products');
    await page.waitForSelector('[data-slide-table]');
    
    const providerId = 'fd8bfdf8-162d-4a95-954d-ca4279edc46f';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape all GPU tables
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      const slides = document.querySelectorAll('[data-slide]');
      const gpus: ScrapedGPU[] = [];

      slides.forEach(slide => {
        // Skip storage and CPU slides
        const header = slide.querySelector('h4');
        if (!header || header.textContent?.includes('CPU') || header.textContent?.includes('Storage')) {
          return;
        }

        const table = slide.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 8) return;

          const instanceName = cells[0].textContent?.trim() || '';
          const gpuModel = cells[1].textContent?.trim() || '';
          const gpuCount = parseInt(cells[2].textContent?.trim() || '0');
          const vram = parseInt(cells[5].textContent?.trim() || '0');
          const priceText = cells[7].textContent?.trim() || '';
          const price = parseFloat(priceText.replace('$', '').replace('/h', ''));

          if (instanceName && gpuModel && !isNaN(gpuCount) && !isNaN(vram) && !isNaN(price)) {
            gpus.push({
              name: gpuModel,
              instanceName,
              gpuCount,
              vram,
              price: price / gpuCount // Price per GPU
            });
          }
        });
      });

      return gpus;
    });

    console.log('📊 Scraped GPU Data:', gpuData);

    // Match GPUs with known models
    console.log('🔍 Matching GPUs with known models...');
    const matchResults: MatchResult[] = [];
    const unmatchedGPUs: ScrapedGPU[] = [];
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          instanceName: gpu.instanceName,
          gpuName: gpu.name,
          matchedModel: matchingModel.name,
          price: gpu.price,
          vram: gpu.vram,
          gpuCount: gpu.gpuCount
        });
      } else {
        unmatchedGPUs.push(gpu);
      }
    }

    // Insert new prices
    console.log('💾 Starting database updates...');
    const priceInserts = [];
    
    for (const result of matchResults) {
      const matchingModel = existingModels.find(m => m.name === result.matchedModel);
      if (!matchingModel) continue;

      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: result.price,
          gpu_count: result.gpuCount,
          source_name: 'DataCrunch',
          source_url: 'https://datacrunch.io/products'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.gpuName}:`, priceError);
      } else {
        priceInserts.push(result);
      }
    }

    await closeBrowser(browser, isRemote);

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults,
      unmatchedGPUs,
      priceInserts
    });

  } catch (error) {
    console.error('Error:', error);
    await closeBrowser(browser, isRemote);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 