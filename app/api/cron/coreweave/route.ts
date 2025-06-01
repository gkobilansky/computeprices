import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

interface ScrapedGPU {
  name: string;
  price: number;
  gpuCount: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  gpu_model_id: string;
  price: number;
  gpuCount: number;
}

export async function GET(request: Request) {
  let browser: BrowserInstance | null = null;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting CoreWeave GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;

    
    const page = await browser.newPage();

    await page.goto('https://www.coreweave.com/pricing');
    await page.waitForSelector('.table-v2.kubernetes-gpu-pricing');
    
    const providerId = '1d434a66-bf40-40a8-8e80-d5ab48b6d27f';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU pricing table
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      // Look for GPU pricing rows specifically
      const rows = document.querySelectorAll('.kubernetes-gpu-pricing .table-row');
      
      return Array.from(rows).map((row, index) => {
        const cells = row.querySelectorAll('.table-v2-cell');
        if (cells.length < 7) return null;

        // Extract GPU name from first cell
        const nameElement = cells[0].querySelector('.table-model-name');
        if (!nameElement) return null;
        const name = nameElement.textContent?.trim().toUpperCase() || '';
        
        // Extract GPU count from second cell
        const gpuCountText = cells[1].textContent?.trim() || '';
        // Handle superscript numbers (like "4¹" should be "4")
        const cleanedCountText = gpuCountText.split(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/)[0];
        const gpuCount = parseInt(cleanedCountText.replace(/[^\d]/g, '')) || 1;
        
        // Extract price from last cell (7th cell - Instance Price Per Hour)
        const priceElement = cells[6]; // 7th cell (0-indexed)
        if (!priceElement) return null;
        const priceText = priceElement.textContent?.trim() || '';
        const totalPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        // Calculate per-GPU price
        const price = totalPrice / gpuCount;
        
        if (!name || isNaN(totalPrice) || isNaN(gpuCount)) return null;
        
        return {
          name,
          price,
          gpuCount,
        };
      }).filter((gpu): gpu is ScrapedGPU => gpu !== null && Boolean(gpu.name) && !isNaN(gpu.price));
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
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          gpu_model_id: matchingModel.id,
          price: gpu.price,
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
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: result.gpu_model_id,
          price_per_hour: result.price,
          gpu_count: result.gpuCount,
          source_name: 'CoreWeave',
          source_url: 'https://www.coreweave.com/pricing'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.matched_model}:`, priceError);
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