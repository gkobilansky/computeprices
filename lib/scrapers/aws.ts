import { SupabaseClient } from '@supabase/supabase-js';
import { findMatchingGPUModel, parseMemory } from '../scraper-utils';
import { JSDOM } from 'jsdom';

interface GPUData {
  instanceType: string;
  region: string;
  pricePerHour: number;
  gpuCount: number;
  gpuModel: string;
  vCPUs: number;
  instanceMemory: string;
  acceleratorMemory: string;
  storage: string;
  network: string;
}

export async function scrapeAWS(supabase: SupabaseClient, dryRun = false) {
  try {
    const providerId = '3bb5a379-472f-4c84-9ba4-3337f3922582';
    
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
    
    // Create a DOM parser to parse the HTML content
    const dom = new JSDOM(data.content);
    const doc = dom.window.document;

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Parse the GPU pricing table
    const rows = Array.from(doc.querySelectorAll('table tbody tr')).filter(row => {
      const cells = row.querySelectorAll('td');
      return cells.length >= 8 && cells[0].textContent?.includes('p');
    });

    const gpuData: GPUData[] = rows.map(row => {
      const cells = row.querySelectorAll('td');
      const rateText = cells[2].textContent?.trim() || '';
      const [instanceRate] = rateText.match(/\$(\d+\.\d+)/)?.map(x => parseFloat(x)) || [0];
      const acceleratorInfo = cells[3].textContent?.trim() || '';
      const [count, model] = acceleratorInfo.split('x').map(s => s.trim());
      
      return {
        instanceType: cells[0].textContent?.trim() || '',
        region: cells[1].textContent?.trim() || '',
        pricePerHour: instanceRate,
        gpuCount: parseInt(count),
        gpuModel: model,
        vCPUs: parseInt(cells[4].textContent?.trim() || '0'),
        instanceMemory: cells[5].textContent?.trim() || '',
        acceleratorMemory: cells[6].textContent?.trim() || '',
        storage: cells[7].textContent?.trim() || '',
        network: cells[8].textContent?.trim() || ''
      };
    });

    if (dryRun) {
      return { success: true, data: gpuData, unmatchedGPUs: [] };
    }

    const unmatchedGPUs = [];
    const timestamp = new Date().toISOString();
    
    for (const gpu of gpuData) {
      if (gpu.gpuModel) {  
        const matchingModel = await findMatchingGPUModel(gpu.gpuModel, existingModels);
        
        if (!matchingModel) {
            unmatchedGPUs.push({
            name: gpu.gpuModel,
            vram: parseMemory(gpu.acceleratorMemory)
            });
            continue;
        }

        const pricePerGPU = gpu.pricePerHour / gpu.gpuCount;

        const { data: priceRecord, error: priceError } = await supabase
            .from('gpu_prices')
            .insert({
            provider_id: providerId,
            gpu_model_id: matchingModel.id,
            price_per_hour: pricePerGPU,
            })
            .select()
            .single();

        if (priceError) {
            throw new Error(`Error inserting price record: ${priceError.message}`);
        }

        const { error: providerGpuError } = await supabase
            .from('provider_gpus')
            .upsert({
                provider_id: providerId,
                gpu_model_id: matchingModel.id,
                latest_price_id: priceRecord.id,
                available: true,
                regions: [gpu.region.toLowerCase()],
                specs: {
                    maxVcpus: gpu.vCPUs,
                    maxRam: parseMemory(gpu.instanceMemory),
                    gpuMemory: parseMemory(gpu.acceleratorMemory),
                    storage: gpu.storage,
                    network: gpu.network,
                    instanceType: gpu.instanceType
            },
            created_at: timestamp
            }, {
            onConflict: 'provider_id,gpu_model_id'
            });

        if (providerGpuError) {
            throw new Error(`Error upserting provider GPU: ${providerGpuError.message}`);
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
  }
} 