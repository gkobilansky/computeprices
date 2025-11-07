import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

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
  let browser: BrowserInstance | null = null;
  let isRemote = false;
  
  try {
    console.log('🔍 Starting Hyperstack GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;
    
    const page = await browser.newPage();

    await page.goto('https://www.hyperstack.cloud/gpu-pricing', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    await page.waitForSelector('.page-price_card_row_item', { timeout: 60000 });
    
    const providerId = '54cc0c05-b0e6-49b3-95fb-831b36dd7efd';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU cards
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      const normalizeText = (text?: string | null) =>
        (text || '')
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const cards = Array.from(document.querySelectorAll('.page-price_card'));
      const onDemandCard = cards.find(card => {
        const heading = normalizeText(card.querySelector('h3')?.textContent || '');
        return heading.toLowerCase().includes('on-demand gpu');
      });

      if (!onDemandCard) {
        return [];
      }

      const rows = onDemandCard.querySelectorAll('.page-price_card_row_item');

      return Array.from(rows)
        .map(row => {
          const cols = row.querySelectorAll('.page-price_card_row_item_col');
          const name = normalizeText(cols[0]?.textContent || '');
          const vramText = normalizeText(cols[1]?.textContent || '');
          const vram = parseInt(vramText.replace(/[^0-9.]/g, ''), 10);
          const priceTextRaw = normalizeText(
            (cols[4] ?? cols[cols.length - 1])?.textContent || ''
          );
          const price = parseFloat(priceTextRaw.replace(/[^0-9.]/g, ''));

          if (!name || Number.isNaN(vram) || Number.isNaN(price)) {
            return null;
          }

          return {
            name,
            vram,
            price,
          };
        })
        .filter((gpu): gpu is ScrapedGPU =>
          gpu !== null && Boolean(gpu.name) && !Number.isNaN(gpu.vram) && !Number.isNaN(gpu.price)
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
