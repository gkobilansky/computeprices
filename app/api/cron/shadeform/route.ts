import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import shadeformProviders from '@/data/shadeformProviders.json';

interface ShadeformInstanceConfigs {
  memory_in_gb: number;
  storage_in_gb: number;
  vcpus: number;
  num_gpus: number;
  gpu_type: string;
  interconnect: string;
  vram_per_gpu_in_gb: number;
}

interface ShadeformInstanceAvailability {
  region: string;
  available: boolean;
  display_name: string;
}

interface ShadeformInstanceType {
  id: string;
  shade_instance_type: string;
  cloud_instance_type: string;
  configuration:  ShadeformInstanceConfigs;
  hourly_price: number;
  availability: ShadeformInstanceAvailability[];
  cloud: string; // Provider name
}

interface ShadeformResponse {
  instance_types: ShadeformInstanceType[];
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

interface ProviderResults {
  provider: string;
  providerId: string;
  matchResults: MatchResult[];
  unmatchedGPUs: UnmatchedGPU[];
}

const buildShadeformSourceUrl = (cloud: string, gpuType: string) => {
  const url = new URL('https://platform.shadeform.ai/');
  url.searchParams.set('referral', '6B321750');
  if (cloud) {
    url.searchParams.set('cloud', cloud.trim().toLowerCase().replace(/\s+/g, ''));
  }
  if (gpuType) {
    url.searchParams.set('gputype', gpuType.trim().toUpperCase());
  }
  return url.toString();
};

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting Shadeform GPU API fetch...');
    
    const apiKey = process.env.SHADEFORM_API_KEY;
    const response = await fetch('https://api.shadeform.ai/v1/instances/types', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const responseData = await response.json() as ShadeformResponse;
        
    // Group instances by cloud provider
    const instancesByProvider = responseData.instance_types.reduce((acc, instance) => {
      const cloud = instance.cloud;
      if (!acc[cloud]) {
        acc[cloud] = [];
      }
      acc[cloud].push(instance);
      return acc;
    }, {} as Record<string, ShadeformInstanceType[]>);

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    console.log('📊 Processing GPU Data...');
    
    const results = [];

    // Process each provider's instances
    for (const [cloud, instances] of Object.entries(instancesByProvider)) {
      const provider = shadeformProviders.find(p => p.name === cloud);
      if (!provider || !provider.providerId) {
        console.warn(`⚠️ No provider ID found for cloud: ${cloud}`);
        continue;
      }

      const providerResults: ProviderResults = {
        provider: cloud,
        providerId: provider.providerId,
        matchResults: [],
        unmatchedGPUs: []
      };

      // Process instances for this provider
      for (const instance of instances) {
        const { configuration, hourly_price } = instance;
        const gpuName = configuration.gpu_type.toUpperCase();
        const gpuCount = configuration.num_gpus;
        const sourceUrl = buildShadeformSourceUrl(cloud, gpuName);

        const matchingModel = await findMatchingGPUModel(gpuName, existingModels);
        
        if (matchingModel) {
          providerResults.matchResults.push({
            scraped_name: gpuName,
            gpu_model_id: matchingModel.id,
            matched_name: matchingModel.name,
            price: hourly_price / 100,
            gpu_count: gpuCount
          });
          
          // Insert price for this match
          const { error: priceError } = await supabaseAdmin
            .from('prices')
            .insert({
              provider_id: provider.providerId,
              gpu_model_id: matchingModel.id,
              price_per_hour: hourly_price / 100,
              gpu_count: gpuCount,
              source_name: 'Shadeform API',
              source_url: sourceUrl
            });

          if (priceError) {
            console.error(`Error inserting price for ${matchingModel.name}:`, priceError);
          }

          console.log(`✅ Matched for ${cloud}: ${gpuName} → ${matchingModel.name}`);
        } else {
          providerResults.unmatchedGPUs.push({
            name: gpuName,
            gpu_count: gpuCount,
            price: hourly_price / 100
          });
          console.log(`❌ Unmatched for ${cloud}: ${gpuName}`);
        }
      }

      results.push(providerResults);
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
