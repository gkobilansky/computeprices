import puppeteer from 'puppeteer';
import { SupabaseClient } from '@supabase/supabase-js';
import { extractGPUModel, findMatchingGPUModel } from '../scraper-utils';

interface GPUData {
  name: string;
  gpuCount: number;
  vram: number;
  price: number;
}

export async function scrapeLambda(supabase: SupabaseClient, dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';
    await page.goto('https://lambdalabs.com/service/gpu-cloud#pricing');
    await page.waitForSelector('table');

    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    const gpuData: GPUData[] = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return null;
        
        const fullName = cells[0].textContent?.trim() || '';
        const name = fullName
          .replace(/^(On-demand|Reserved)\s+\d+x\s+/, '')
          .trim()
          .toUpperCase();
        
        const gpuCountMatch = fullName.match(/(\d+)x/);
        const gpuCount = gpuCountMatch ? parseInt(gpuCountMatch[1]) : 1;
        
        const vramText = cells[1].textContent?.trim() || '0';
        const vram = parseInt(vramText.replace('GB', ''));
        
        const priceText = cells[5].textContent?.trim() || '0';
        const price = parseFloat(priceText.replace('$', '').split('/')[0]);
        
        return { name, gpuCount, vram, price };
      })
      .filter((row): row is GPUData => row !== null && !isNaN(row.price) && row.price !== null);
    });

    if (dryRun) {
      return { success: true, data: gpuData, unmatchedGPUs: [] };
    }

    const unmatchedGPUs = [];
    const timestamp = new Date().toISOString();
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (!matchingModel) {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          gpuCount: gpu.gpuCount
        });
        continue;
      }

      const { data: priceRecord, error: priceError } = await supabase
        .from('gpu_prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: gpu.price,
          timestamp: timestamp
        })
        .select()
        .single();

      if (priceError) {
        throw new Error(`Error inserting price record for ${gpu.name}: ${priceError.message}`);
      }

      const { error: providerGpuError } = await supabase
        .from('provider_gpus')
        .upsert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          latest_price_id: priceRecord.id,
          available: true,
          regions: ['us-east-1'],
          min_hours: 1,
          created_at: timestamp
        }, {
          onConflict: 'provider_id,gpu_model_id'
        });

      if (providerGpuError) {
        throw new Error(`Error upserting provider GPU for ${gpu.name}: ${providerGpuError.message}`);
      }
    }

    return {
      success: true,
      data: gpuData,
      unmatchedGPUs
    };

  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
} 