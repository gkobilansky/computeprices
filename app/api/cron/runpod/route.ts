import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getSafeBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

interface ScrapedGPU {
  name: string;
  vram: number | null;
  price: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  price: number;
  gpu_model_id: string;
  vram: number | null;
}

export async function GET(request: Request) {
  let browser: BrowserInstance | null = null;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting RunPod GPU scraper...');

    const config = await getSafeBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;
    
    const page = await browser.newPage();

    await page.goto('https://www.runpod.io/pricing');
    await page.waitForSelector('.MuiGrid-container');
    
    const providerId = '30a69dae-5939-499a-a4f5-5114797dcdb3';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU cards
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      const cards = document.querySelectorAll('.MuiGrid-container .MuiGrid-item');
      
      return Array.from(cards).map(card => {
        // Get GPU name
        const nameElement = card.querySelector('.css-6ukrhs');
        if (!nameElement) return null;
        const name = nameElement.textContent?.trim().toUpperCase() || '';
        
        // Get VRAM
        const vramElement = card.querySelector('.css-1xqiyyp');
        const vramMatch = vramElement?.textContent?.match(/(\d+)GB VRAM/);
        const vram = vramMatch ? parseInt(vramMatch[1]) : null;

        // Get prices for both Secure and Community Cloud
        const priceElements = card.querySelectorAll('.css-c16693');
        const prices = Array.from(priceElements).map(el => {
          return parseFloat(el.textContent?.replace('$', '') || '0');
        }).filter(price => !isNaN(price));

        // Get the lowest price
        const price = prices.length > 0 ? Math.min(...prices) : 0;
        
        if (!name || price === 0) return null;

        return {
          name,
          vram,
          price,
        };
      }).filter((gpu): gpu is ScrapedGPU => 
        gpu !== null && 
        Boolean(gpu.name) && 
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
          price: gpu.price,
          gpu_model_id: matchingModel.id,
          vram: gpu.vram
        });
      } else {
        unmatchedGPUs.push(gpu);
      }
    }

    // Insert new prices
    console.log('💾 Starting database updates...');
    const priceInserts = [];
    
    for (const match of matchResults) {
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: match.gpu_model_id,
          price_per_hour: match.price,
          source_name: 'RunPod',
          source_url: 'https://www.runpod.io/pricing'
        });

      if (priceError) {
        console.error(`Error inserting price for ${match.scraped_name}:`, priceError);
      } else {
        priceInserts.push(match);
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
        vram: r.vram ? `${r.vram}GB` : 'N/A',
        price: `$${r.price}/hr`
      })),
      unmatchedGPUs: unmatchedGPUs.map(g => ({
        name: g.name,
        vram: g.vram ? `${g.vram}GB` : 'N/A',
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