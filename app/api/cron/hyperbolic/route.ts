import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

// V1 API types (marketplace with all GPU types)
interface HyperbolicV1GPU {
  model: string;
  ram: number;
}

interface HyperbolicV1Instance {
  cluster_name: string;
  id: string;
  status: string;
  gpus_total: number;
  gpus_reserved: number;
  hardware: {
    gpus: HyperbolicV1GPU[];
  };
  pricing: {
    price: {
      amount: number;
    };
  };
  reserved: boolean;
}

interface HyperbolicV1Response {
  instances: HyperbolicV1Instance[];
}

// V2 API types (on-demand options - H100 only)
interface HyperbolicV2VMOption {
  gpuCount: number;
  costPerHour: number;
}

interface HyperbolicV2BareMetalOption {
  ethernet: {
    gpuCount: number;
    costPerHour: number;
  };
  infiniband: {
    gpuCount: number;
    costPerHour: number;
  };
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

async function fetchV1Marketplace(apiKey: string): Promise<HyperbolicV1Response | null> {
  try {
    const response = await fetch('https://api.hyperbolic.xyz/v1/marketplace', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filters: {} })
    });

    if (!response.ok) {
      console.log(`V1 API returned status ${response.status}`);
      return null;
    }

    return await response.json() as HyperbolicV1Response;
  } catch (error) {
    console.log('V1 API error:', error);
    return null;
  }
}

async function fetchV2OnDemand(apiKey: string): Promise<{ vm: HyperbolicV2VMOption[], bareMetal: HyperbolicV2BareMetalOption | null }> {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const [vmResponse, bareMetalResponse] = await Promise.all([
    fetch('https://api.hyperbolic.xyz/v2/marketplace/virtual-machine-options', { headers }),
    fetch('https://api.hyperbolic.xyz/v2/marketplace/bare-metal-options', { headers })
  ]);

  const vm = vmResponse.ok ? await vmResponse.json() as HyperbolicV2VMOption[] : [];
  const bareMetal = bareMetalResponse.ok ? await bareMetalResponse.json() as HyperbolicV2BareMetalOption : null;

  return { vm, bareMetal };
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting Hyperbolic GPU API fetch...');

    const apiKey = process.env.HYPERBOLIC_API_KEY;
    if (!apiKey) {
      throw new Error('HYPERBOLIC_API_KEY environment variable is required');
    }

    const providerId = process.env.HYPERBOLIC_PROVIDER_ID;
    if (!providerId) {
      throw new Error('HYPERBOLIC_PROVIDER_ID environment variable is required');
    }

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    const matchResults: MatchResult[] = [];
    const unmatchedGPUs: UnmatchedGPU[] = [];
    const gpuPriceMap = new Map<string, {
      gpu_name: string;
      best_price: number;
      gpu_count: number;
    }>();

    // Try V1 marketplace API first (has all GPU types)
    console.log('📡 Trying V1 marketplace API...');
    const v1Data = await fetchV1Marketplace(apiKey);

    if (v1Data?.instances?.length) {
      console.log(`V1 API: Received ${v1Data.instances.length} instances`);

      for (const instance of v1Data.instances) {
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
            gpu_count: 1
          });
        }
      }
    } else {
      console.log('V1 API unavailable, trying V2 on-demand API...');
    }

    // Try V2 on-demand API (H100 only, but more reliable)
    console.log('📡 Fetching V2 on-demand options...');
    const v2Data = await fetchV2OnDemand(apiKey);

    // V2 VM options - find lowest price per GPU for H100
    if (v2Data.vm?.length) {
      console.log(`V2 API: Received ${v2Data.vm.length} VM options`);

      // Find the single-GPU price (most accurate per-GPU rate)
      const singleGpuOption = v2Data.vm.find(opt => opt.gpuCount === 1);
      if (singleGpuOption) {
        const gpuName = 'H100 SXM';
        const existing = gpuPriceMap.get(gpuName);
        if (!existing || singleGpuOption.costPerHour < existing.best_price) {
          gpuPriceMap.set(gpuName, {
            gpu_name: gpuName,
            best_price: singleGpuOption.costPerHour,
            gpu_count: 1
          });
        }
      }
    }

    console.log(`📊 Found ${gpuPriceMap.size} unique GPU types`);

    // Match GPUs to existing models
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
