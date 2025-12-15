import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface HyperbolicGPU {
  model: string;
  ram: number;
}

interface HyperbolicPricing {
  price: {
    amount: number;
    period?: string;
  };
}

interface HyperbolicInstance {
  cluster_name: string;
  id: string;
  status: string;
  gpus_total: number;
  gpus_reserved: number;
  hardware: {
    gpus: HyperbolicGPU[];
    cpus?: { virtual_cores: number }[];
    ram?: { capacity: number }[];
    storage?: { capacity: number }[];
  };
  pricing: HyperbolicPricing;
  location?: { region: string };
  reserved: boolean;
}

interface HyperbolicResponse {
  instances: HyperbolicInstance[];
}

interface MatchResult {
  scraped_name: string;
  gpu_model_id: string;
  matched_name: string;
  price: number;
  gpu_count: number;
}

interface UnmatchedGPU {
  name: string;
  gpu_count: number;
  price: number;
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting Hyperbolic GPU API fetch...');

    const apiKey = process.env.HYPERBOLIC_API_KEY;
    if (!apiKey) {
      throw new Error('HYPERBOLIC_API_KEY environment variable is required');
    }

    console.log('API Key exists:', !!apiKey);

    const response = await fetch('https://api.hyperbolic.xyz/v1/marketplace', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filters: {} })
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const responseData = await response.json() as HyperbolicResponse;
    console.log(`Received ${responseData.instances?.length || 0} instances`);

    const { instances } = responseData;
    if (!instances || instances.length === 0) {
      console.log('No instances found');
      return NextResponse.json({
        success: true,
        matched: 0,
        unmatched: 0,
        message: 'No instances found'
      });
    }

    const providerId = process.env.HYPERBOLIC_PROVIDER_ID;
    if (!providerId) {
      throw new Error('HYPERBOLIC_PROVIDER_ID environment variable is required');
    }

    const matchResults: MatchResult[] = [];
    const unmatchedGPUs: UnmatchedGPU[] = [];

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    console.log('📊 Processing GPU instances...');

    // Group instances by GPU model and find the best (lowest) price for each
    const gpuPriceMap = new Map<string, {
      gpu_name: string;
      best_price: number;
      gpu_count: number;
      vram: number;
    }>();

    for (const instance of instances) {
      // Skip reserved or unavailable instances
      if (instance.reserved || instance.status !== 'available') continue;
      if (!instance.hardware?.gpus?.length) continue;
      if (!instance.pricing?.price?.amount) continue;

      const gpu = instance.hardware.gpus[0];
      if (!gpu?.model) continue;

      const gpuName = gpu.model.trim().toUpperCase();
      const availableGpus = instance.gpus_total - instance.gpus_reserved;
      if (availableGpus <= 0) continue;

      // Price is in cents, convert to dollars per GPU
      const pricePerGpu = (instance.pricing.price.amount / 100) / instance.gpus_total;

      const existing = gpuPriceMap.get(gpuName);
      if (!existing || pricePerGpu < existing.best_price) {
        gpuPriceMap.set(gpuName, {
          gpu_name: gpuName,
          best_price: pricePerGpu,
          gpu_count: 1,
          vram: gpu.ram || 0
        });
      }
    }

    console.log(`Found ${gpuPriceMap.size} unique GPU types`);

    // Process each unique GPU
    for (const gpuData of Array.from(gpuPriceMap.values())) {
      const matchingModel = await findMatchingGPUModel(gpuData.gpu_name, existingModels);

      if (matchingModel) {
        matchResults.push({
          scraped_name: gpuData.gpu_name,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          price: gpuData.best_price,
          gpu_count: gpuData.gpu_count
        });
        console.log(`✅ Matched: ${gpuData.gpu_name} → ${matchingModel.name} at $${gpuData.best_price.toFixed(2)}/hr`);
      } else {
        unmatchedGPUs.push({
          name: gpuData.gpu_name,
          gpu_count: gpuData.gpu_count,
          price: gpuData.best_price
        });
        console.log(`❌ Unmatched: ${gpuData.gpu_name}`);
      }
    }

    console.log('💾 Starting database updates...');

    // Insert new prices
    for (const result of matchResults) {
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: result.gpu_model_id,
          price_per_hour: result.price,
          gpu_count: result.gpu_count,
          source_name: 'Hyperbolic',
          source_url: 'https://app.hyperbolic.xyz/compute'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.matched_name}:`, priceError);
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults,
      unmatchedGPUs,
      totalInstances: instances.length,
      uniqueGPUs: gpuPriceMap.size
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
