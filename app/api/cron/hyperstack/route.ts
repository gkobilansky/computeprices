import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getBrowserConfig, closeBrowser } from '@/lib/utils/puppeteer-config';

interface ScrapedGPU {
  name: string;
  vram: number;
  price: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  vram: number;
  price: number;
}

export async function GET(request: Request) {
  let browser;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting Hyperstack GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;
    
    const page = await browser.newPage();

    await page.goto('https://www.hyperstack.cloud/gpu-pricing');
    await page.waitForSelector('.gpu-grd-pricing_first');
    
    const providerId = '54cc0c05-b0e6-49b3-95fb-831b36dd7efd';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU cards
    const gpuData: ScrapedGPU[] = await page.evaluate(() => {
      const rows = document.querySelectorAll('.gpu-grd-pricing_first .gpugpf-box-table table tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0]?.innerText?.trim() || '';
        const vram = parseInt(cells[1]?.innerText?.trim() || '0', 10);
        const priceText = cells[4]?.innerText?.trim() || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        
        if (!name || isNaN(vram) || isNaN(price)) return null;
        
        return {
          name,
          vram,
          price
        };
      }).filter((gpu): gpu is ScrapedGPU => 
        gpu !== null && 
        Boolean(gpu.name) && 
        !isNaN(gpu.vram) && 
        !isNaN(gpu.price)
      );
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
          vram: gpu.vram,
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
      const matchingModel = await findMatchingGPUModel(result.scraped_name, existingModels);
      if (!matchingModel) continue;

      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: result.price,
          source_name: 'Hyperstack',
          source_url: 'https://www.hyperstack.cloud/gpu-pricing'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.scraped_name}:`, priceError);
      } else {
        priceInserts.push(result);
      }
    }

    await closeBrowser(browser, isRemote);

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults: matchResults.map(r => ({
        scraped_name: r.scraped_name,
        matched_model: r.matched_model,
        vram: `${r.vram}GB`,
        price: `$${r.price}/hr`
      })),
      unmatchedGPUs: unmatchedGPUs.map(g => ({
        name: g.name,
        vram: `${g.vram}GB`,
        price: `$${g.price}/hr`
      })),
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