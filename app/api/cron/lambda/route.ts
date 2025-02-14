import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface LambdaInstanceSpecs {
  vcpus: number;
  memory_gib: number;
  storage_gib: number;
  gpus: number;
}

interface LambdaInstanceType {
  name: string;
  description: string;
  gpu_description: string;
  price_cents_per_hour: number;
  specs: LambdaInstanceSpecs;
}

interface LambdaRegion {
  name: string;
  description: string;
}

interface LambdaInstance {
  instance_type: LambdaInstanceType;
  regions_with_capacity_available: LambdaRegion[];
}

interface LambdaResponse {
  data: Record<string, LambdaInstance>;
}

export async function POST(request: Request) {
  try {
    console.log('🔍 Starting Lambda Labs GPU API fetch...');
    
    // // Verify the request is from Vercel Cron
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    // Debug: Check if API key exists (don't log the full key)
    const apiKey = process.env.LAMBDA_LABS_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey?.substring(0, 4));

    const response = await fetch('https://cloud.lambdalabs.com/api/v1/instances', {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const responseData = await response.json() as LambdaResponse;
    console.log('API response data:', JSON.stringify(responseData, null, 2));
    
    const { data: instanceTypes } = responseData;
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';
    const matchResults = [];
    const unmatchedGPUs = [];

    // Debug: Log instance types
    console.log('Instance types received:', Object.keys(instanceTypes));

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Debug: Log existing models
    console.log('Existing GPU models:', existingModels?.map(m => m.name));

    console.log('📊 Processing GPU Data...');
    
    for (const [instanceKey, instance] of Object.entries(instanceTypes)) {
      // Skip CPU-only instances
      if (instanceKey.startsWith('cpu_')) continue;
      
      const { instance_type: { gpu_description, price_cents_per_hour, specs } } = instance;
      if (!gpu_description || gpu_description === 'N/A') continue;

      const gpuName = gpu_description.split('(')[0].trim().toUpperCase();
      const price = price_cents_per_hour / 100; // Convert cents to dollars
      const gpuCount = specs.gpus;

      const matchingModel = await findMatchingGPUModel(gpuName, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpuName,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          price: price,
          gpu_count: gpuCount
        });
        console.log(`✅ Matched: ${gpuName} → ${matchingModel.name}`);
      } else {
        unmatchedGPUs.push({
          name: gpuName,
          gpu_count: gpuCount,
          price: price
        });
        console.log(`❌ Unmatched: ${gpuName}`);
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
          source_name: 'Lambda Labs API',
          source_url: 'https://docs.lambdalabs.com/public-cloud/cloud-api/#listing-instances-types-offered-by-lambda-gpu-cloud'
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
      debug: {
        instanceTypes: Object.keys(instanceTypes),
        existingModels: existingModels?.map(m => m.name)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 