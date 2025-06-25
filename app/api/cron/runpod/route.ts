import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface RunPodGPUType {
  id: string;
  displayName: string;
  memoryInGb: number;
  communityPrice: number | null;
  communitySpotPrice: number | null;
  secureCloud: boolean;
  communityCloud: boolean;
}

interface ScrapedGPU {
  name: string;
  vram: number;
  price: number;
  gpu_count: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  price: number;
  gpu_model_id: string;
  vram: number;
  gpu_count: number;
}

async function fetchRunPodGPUTypes(): Promise<RunPodGPUType[]> {
  const response = await fetch('https://api.runpod.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
    },
    body: JSON.stringify({
      operationName: 'GpuTypes',
      variables: {},
      query: `query GpuTypes {
        gpuTypes {
          id
          displayName
          memoryInGb
          secureCloud
          communityCloud
          __typename
        }
      }`
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GPU types: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.gpuTypes;
}

async function fetchRunPodGPUPricing(gpuId: string): Promise<RunPodGPUType | null> {
  const response = await fetch('https://api.runpod.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
    },
    body: JSON.stringify({
      operationName: 'CommunityGpuTypes',
      variables: {
        gpuTypesInput: { id: gpuId },
        lowestPriceInput: {
          gpuCount: 1,
          minDisk: 0,
          minMemoryInGb: 8,
          minVcpuCount: 2,
          secureCloud: false,
          countryCode: null,
          minDownload: 400,
          minUpload: 400,
          supportPublicIp: false
        }
      },
      query: `query CommunityGpuTypes($lowestPriceInput: GpuLowestPriceInput, $gpuTypesInput: GpuTypeFilter) {
        gpuTypes(input: $gpuTypesInput) {
          lowestPrice(input: $lowestPriceInput) {
            minimumBidPrice
            uninterruptablePrice
            minVcpu
            minMemory
            stockStatus
            maxUnreservedGpuCount
            availableGpuCounts
            __typename
          }
          id
          displayName
          memoryInGb
          communityPrice
          communitySpotPrice
          __typename
        }
      }`
    })
  });

  if (!response.ok) {
    console.error(`Failed to fetch pricing for GPU ${gpuId}: ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  const gpuTypes = data.data.gpuTypes;
  return gpuTypes.length > 0 ? gpuTypes[0] : null;
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting RunPod GraphQL GPU scraper...');
    
    const providerId = '30a69dae-5939-499a-a4f5-5114797dcdb3';

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Step 1: Get all GPU types
    console.log('📡 Fetching GPU types from RunPod API...');
    const gpuTypes = await fetchRunPodGPUTypes();
    console.log(`Total GPU types found: ${gpuTypes.length}`);
    
    // Filter to only community cloud GPUs (since we're querying community pricing)
    const communityGPUs = gpuTypes.filter(gpu => gpu.communityCloud);
    console.log(`Found ${communityGPUs.length} community cloud GPU types`);
    console.log('Community GPUs:', communityGPUs.map(g => g.displayName));

    // Step 2: Get pricing for each GPU type
    const gpuData: ScrapedGPU[] = [];
    
    for (const gpuType of communityGPUs) {
      console.log(`🔍 Fetching pricing for ${gpuType.displayName}...`);
      
      const pricingData = await fetchRunPodGPUPricing(gpuType.id);
      if (pricingData && (pricingData.communityPrice || pricingData.communitySpotPrice)) {
        // Use the lower price (spot price if available, otherwise regular price)
        const spotPrice = pricingData.communitySpotPrice;
        const regularPrice = pricingData.communityPrice;
        
        let finalPrice: number;
        if (spotPrice && regularPrice) {
          finalPrice = Math.min(spotPrice, regularPrice);
        } else if (spotPrice) {
          finalPrice = spotPrice;
        } else if (regularPrice) {
          finalPrice = regularPrice;
        } else {
          continue; // Skip if no pricing available
        }

        gpuData.push({
          name: pricingData.displayName.toUpperCase(),
          vram: pricingData.memoryInGb,
          price: finalPrice,
          gpu_count: 1 // RunPod prices are per GPU
        });
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('📊 Fetched GPU Data:', gpuData);

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
          price: gpu.price,
          gpu_model_id: matchingModel.id,
          vram: gpu.vram,
          gpu_count: gpu.gpu_count
        });
      } else {
        unmatchedGPUs.push(gpu);
      }
    }

    // Insert new prices
    console.log('💾 Starting database updates...');
    const priceInserts = [];
    
    for (const match of matchResults) {
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: match.gpu_model_id,
          price_per_hour: match.price,
          gpu_count: match.gpu_count,
          source_name: 'RunPod API',
          source_url: 'https://runpod.io?ref=fdhbgkyk'
        });

      if (priceError) {
        console.error(`Error inserting price for ${match.scraped_name}:`, priceError);
      } else {
        priceInserts.push(match);
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults: matchResults.map(r => ({
        scraped_name: r.scraped_name,
        matched_model: r.matched_model,
        vram: `${r.vram}GB`,
        price: `$${r.price}/hr`,
        gpu_count: r.gpu_count
      })),
      unmatchedGPUs: unmatchedGPUs.map(g => ({
        name: g.name,
        vram: `${g.vram}GB`,
        price: `$${g.price}/hr`,
        gpu_count: g.gpu_count
      })),
      priceInserts
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 