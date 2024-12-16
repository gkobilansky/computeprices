import puppeteer from 'puppeteer';
import { SupabaseClient } from '@supabase/supabase-js';
import { extractGPUModel, findMatchingGPUModel } from '../scraper-utils';

interface ProviderPrices {
  vast: number | null;
  lambda: number | null;
  fluidstack: number | null;
  coreweave: number | null;
}

interface GPUData {
  name: string;
  prices: ProviderPrices;
}

interface ProviderIds {
  vast: string;
  lambda: string;
  fluidstack: string;
  coreweave: string;
}

export async function scrapeVast(supabase: SupabaseClient, dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    const providerId: ProviderIds = {
      vast: '4a4fdeae-7d4f-4d75-9967-54bbd498e4bf',
      lambda: '825cef3b-54f5-426e-aa29-c05fe3070833',
      fluidstack: 'a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182',
      coreweave: '1d434a66-bf40-40a8-8e80-d5ab48b6d27f'
    };

    await page.goto('https://vast.ai/pricing');
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
        if (cells.length < 5) return null;

        const nameCell = cells[0].textContent?.trim() || '';
        const name = nameCell
          .replace(/[\[\]]/g, '')
          .split('/')[0]
          .trim()
          .toUpperCase();

        const prices = {
          vast: parseFloat(cells[1].textContent?.replace('$', '') || '') || null,
          lambda: parseFloat(cells[2].textContent?.replace('$', '') || '') || null,
          fluidstack: parseFloat(cells[3].textContent?.replace('$', '') || '') || null,
          coreweave: parseFloat(cells[4].textContent?.replace('$', '') || '') || null
        };

        return { name, prices };
      }).filter((row): row is GPUData => row !== null && row.prices.vast !== null);
    });

    if (dryRun) {
      return { success: true, data: gpuData, unmatchedGPUs: [] };
    }

    const unmatchedGPUs = [];
    const timestamp = new Date().toISOString();

    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (!matchingModel) {
        unmatchedGPUs.push(gpu.name);
        continue;
      }

      // Insert price records and update provider_gpus for each provider
      for (const [provider, price] of Object.entries(gpu.prices)) {
        if (price === null || !providerId[provider as keyof ProviderIds]) continue;

        // Insert the new price record
        const { data: priceRecord, error: priceError } = await supabase
          .from('gpu_prices')
          .insert({
            provider_id: providerId[provider as keyof ProviderIds],
            gpu_model_id: matchingModel.id,
            price_per_hour: price,
            timestamp: timestamp
          })
          .select()
          .single();

        if (priceError) {
          throw new Error(`Error inserting price record for ${gpu.name} (${provider}): ${priceError.message}`);
        }

        // Update the provider_gpu record
        const { error: providerGpuError } = await supabase
          .from('provider_gpus')
          .upsert({
            provider_id: providerId[provider as keyof ProviderIds],
            gpu_model_id: matchingModel.id,
            latest_price_id: priceRecord.id,
            available: true,
            created_at: timestamp
          }, {
            onConflict: 'provider_id,gpu_model_id'
          });

        if (providerGpuError) {
          throw new Error(`Error upserting provider GPU for ${gpu.name} (${provider}): ${providerGpuError.message}`);
        }
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