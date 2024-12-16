import puppeteer from 'puppeteer';
import { SupabaseClient } from '@supabase/supabase-js';
import { extractGPUModel, findMatchingGPUModel } from '../scraper-utils';
import { JSDOM } from 'jsdom';
interface GPUData {
  name: string;
  vram: number | null;
  price: number;
  maxVcpus: number;
  maxRam: number;
}

export async function scrapeCoreweave(supabase: SupabaseClient, dryRun = false) {
  
  
  try {
    const providerId = '1d434a66-bf40-40a8-8e80-d5ab48b6d27f';
    const response = await fetch('https://api.wintr.com/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://aws.amazon.com/ec2/capacityblocks/pricing/',
          apikey: process.env.WINTR_API_KEY,
          jsrender: true
        })
      });

    if (!response.ok) {
      throw new Error(`Wintr API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const dom = new JSDOM(data.content);
    const doc = dom.window.document;

    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    const rows = Array.from(doc.querySelectorAll('.table-body-row')).filter(row => {
      const cells = row.querySelectorAll('div');
      return cells.length >= 4 && cells[0].textContent?.includes('GB');
    });

    const gpuData: GPUData[] = rows.map(row => {
      const cells = row.querySelectorAll('div');
      const nameCell = cells[0].textContent?.trim() || '';
      const name = nameCell.split('\n')[0].trim().toUpperCase();
      const vramMatch = nameCell.match(/(\d+)\s*GB/);
      const priceText = cells[3].textContent?.trim() || '0';
      
      return {
        name,
        vram: vramMatch ? parseInt(vramMatch[1]) : null,
        price: parseFloat(priceText.replace('$', '')),
        maxVcpus: parseInt(cells[1].textContent?.trim() || '0'),
        maxRam: parseInt(cells[2].textContent?.trim() || '0')
      };
    }).filter(gpu => gpu.name && !isNaN(gpu.price));

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
          vram: gpu.vram
        });
        continue;
      }

      // Insert the new price record
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

      // Update the provider_gpu record
      const { error: providerGpuError } = await supabase
        .from('provider_gpus')
        .upsert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          latest_price_id: priceRecord.id,
          available: true,
          regions: ['us-east'],
          specs: {
            maxVcpus: gpu.maxVcpus,
            maxRam: gpu.maxRam
          },
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