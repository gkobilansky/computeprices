import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
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
}

export async function GET(request: Request) {
  let browser;
  
  try {
    console.log('🔍 Starting CoreWeave GPU scraper...');

    browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
    });

    
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
    const gpuData: ScrapedGPU[] = await page.evaluate(() => {
      const rows = document.querySelectorAll('.kubernetes-gpu-pricing .table-cell-column.table-cell-column-left');
      const priceRows = Array.from(rows).filter(row => {
        const hasName = row.querySelector('a.table-modal-link .table-model-name');
        const hasPrice = row.querySelector('.table-meta-text .table-meta-value');
        return hasName && hasPrice;
      });

      return priceRows.map(row => {
        const nameElement = row.querySelector('a.table-modal-link .table-model-name');
        const priceElement = row.querySelector('.table-meta-text .table-meta-value');
        
        if (!nameElement || !priceElement) return null;

        const name = nameElement.textContent?.trim().toUpperCase() || '';
        const priceText = priceElement.textContent?.trim() || '';
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        return {
          name,
          price,
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
          source_name: 'CoreWeave',
          source_url: 'https://www.coreweave.com/pricing'
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