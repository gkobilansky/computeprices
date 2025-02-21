import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface ScrapedGPU {
  name: string;
  price: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  gpu_model_id: string;
  price: number;
  source_name: string;
  source_url: string;
}

export async function GET(request: Request) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting FluidStack GPU scraper...');
    
    // // Verify the request is from Vercel Cron
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    await page.goto('https://www.fluidstack.io/pricing');
    await page.waitForSelector('.pricing_table');
    
    const providerId = 'a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU pricing table
    const gpuData: ScrapedGPU[] = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.pricing_body tr'));
      
      return rows.map(row => {
        const nameElement = row.querySelector('.table-header-mobile');
        const onDemandElement = row.querySelector('td:nth-child(5) p');
        
        if (!nameElement || !onDemandElement) return null;

        const name = nameElement.textContent?.trim().toUpperCase() || '';
        const priceText = onDemandElement?.textContent?.trim() || '';
        // Only include GPUs with valid on-demand pricing (skip "n/a")
        if (priceText === 'n/a' || !priceText) return null;
        
        const price = parseFloat(priceText.replace('$', ''));
        
        return {
          name,
          price
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
          gpu_model_id: matchingModel.id,
          price: gpu.price,
          source_name: 'FluidStack',
          source_url: 'https://www.fluidstack.io/pricing'
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
          source_name: result.source_name,
          source_url: result.source_url
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.scraped_name}:`, priceError);
      } else {
        priceInserts.push(result);
      }
    }

    await browser.close();

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults: matchResults.map(r => ({
        scraped_name: r.scraped_name,
        matched_model: r.matched_model,
        price: `$${r.price}/hr`
      })),
      unmatchedGPUs: unmatchedGPUs.map(g => ({
        name: g.name,
        price: `$${g.price}/hr`
      })),
      priceInserts
    });

  } catch (error) {
    console.error('Error:', error);
    await browser.close();
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 