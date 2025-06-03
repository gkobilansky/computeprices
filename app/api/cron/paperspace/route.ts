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
    console.log('🔍 Starting Paperspace GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;

    const page = await browser.newPage();

    await page.goto('https://paperspace.com/pricing');
    await page.waitForSelector('.instance-container-flex', { timeout: 10000 });
    
    const providerId = 'c58cd5f6-4bbc-454a-abbf-fad2b94180c6';

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
      
      // Get all instance type holders
      const instanceHolders = document.querySelectorAll('.instance-type-holder-flex');
      
      instanceHolders.forEach(holder => {
        // Get GPU name from h1.instance-names
        const nameElement = holder.querySelector('h1.instance-names');
        if (!nameElement) return;
        const name = nameElement.textContent?.trim() || '';
        
        // Get price from h1.instance-price-2 - look for the visible one (not hidden)
        const priceElements = holder.querySelectorAll('h1.instance-price-2');
        let price = 0;
        
        // Find the first visible price element (not in a .hide container)
        for (const priceEl of Array.from(priceElements)) {
          const priceWrap = priceEl.closest('.instance-price-wrap');
          if (priceWrap && !priceWrap.classList.contains('hide')) {
            const priceText = priceEl.textContent?.trim() || '';
            // Extract price number (remove * and other characters)
            const priceMatch = priceText.match(/(\d+\.?\d*)/);
            if (priceMatch) {
              price = parseFloat(priceMatch[1]);
              break;
            }
          }
        }
        
        if (name && price > 0) {
          results.push({
            name: name.toUpperCase(),
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
          source_name: 'Paperspace',
          source_url: 'https://paperspace.com/pricing'
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