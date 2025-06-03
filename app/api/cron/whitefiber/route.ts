import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

interface ScrapedGPU {
  name: string;
  price: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  gpu_model_id: string;
  price: number;
}

export async function GET(request: Request) {
  let browser: BrowserInstance | null = null;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting WhiteFiber GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;

    const page = await browser.newPage();

    await page.goto('https://www.whitefiber.com/gpu-pricing');
    await page.waitForSelector('.new-pricing-table', { timeout: 10000 });
    
    const providerId = '89652cce-71dc-44d0-af20-ab44485e84ba';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU pricing cards
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      const results: ScrapedGPU[] = [];
      
      // Get all pricing items
      const pricingItems = document.querySelectorAll('.pricing-item-copy');
      
      pricingItems.forEach(item => {
        const topContent = item.querySelector('.pricing-item__top-content');
        if (!topContent) return;
        
        // Get GPU name from h3 in pricing-tag
        const nameElement = topContent.querySelector('.pricing-tag h3');
        if (!nameElement) return;
        const name = nameElement.textContent?.trim().toUpperCase() || '';
        
        // Get price from the heading-h1 element
        const priceElement = topContent.querySelector('.heading-h1');
        if (!priceElement) return;
        const priceText = priceElement.textContent?.trim() || '';
        
        // Extract price number (remove $ and /HR)
        const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        if (name && price > 0) {
          results.push({
            name,
            price
          });
        }
      });
      
      return results;
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
          price: gpu.price
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
          gpu_count: 1,
          source_name: 'WhiteFiber',
          source_url: 'https://www.whitefiber.com/gpu-pricing'
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