import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface ScrapedGPU {
  instanceType: string;
  region: string;
  name: string;
  price: number;
  gpuCount: number;
  vram: number | null;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  instance_type: string;
  gpu_count: number;
  price: string;
}

export async function GET(request: Request) {
  let browser;
  
  try {
    console.log('🔍 Starting AWS GPU scraper...');
    
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();

    await page.goto('https://aws.amazon.com/ec2/capacityblocks/pricing/');
    await page.waitForSelector('table');
    
    const providerId = '3bb5a379-472f-4c84-9ba4-3337f3922582';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape the GPU pricing table
    const gpuData: ScrapedGPU[] = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(1); // Skip header row
      
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;

        // Extract instance type and region
        const instanceType = cells[0].textContent?.trim() || '';
        const region = cells[1].textContent?.trim() || '';
        
        // Extract price - get the per accelerator price in parentheses
        const priceText = cells[2].textContent?.trim() || '';
        const priceMatch = priceText.match(/\((\$[\d.]+)/);
        if (!priceMatch) return null;
        const price = parseFloat(priceMatch[1].replace('$', ''));
        
        // Extract GPU info
        const acceleratorText = cells[3].textContent?.trim() || '';
        const [count, gpuModel] = acceleratorText.split('x').map(s => s.trim());
        const name = gpuModel.toUpperCase();
        
        // Extract memory info
        const acceleratorMemory = cells[6].textContent?.trim() || '';
        const memoryMatch = acceleratorMemory.match(/(\d+)\s*(?:GB|TB)/);
        const vram = memoryMatch ? parseInt(memoryMatch[1]) : null;

        return {
          instanceType,
          region,
          name,
          price,
          gpuCount: parseInt(count),
          vram
        };
      }).filter((gpu): gpu is ScrapedGPU => 
        gpu !== null && 
        Boolean(gpu.name) && 
        !isNaN(gpu.price) && 
        !isNaN(gpu.gpuCount)
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
          instance_type: gpu.instanceType,
          gpu_count: gpu.gpuCount,
          price: `$${gpu.price}/hr`
        });
      } else {
        unmatchedGPUs.push(gpu);
      }
    }

    // Insert new prices
    console.log('💾 Starting database updates...');
    const priceInserts = [];
    
    for (const result of matchResults) {
      const gpu = gpuData.find(g => g.name === result.scraped_name);
      const matchingModel = existingModels.find(m => m.name === result.matched_model);
      
      if (!gpu || !matchingModel) continue;

      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: gpu.price,
          gpu_count: gpu.gpuCount,
          source_name: 'AWS',
          source_url: 'https://aws.amazon.com/ec2/capacityblocks/pricing/'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.matched_model}:`, priceError);
      } else {
        priceInserts.push(result);
      }
    }

    if (browser) {
      await browser.close();
    }

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
    if (browser) {
      await browser.close();
    }
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 