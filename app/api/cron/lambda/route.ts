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

// Vercel cron job will call this endpoint
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting Lambda Labs GPU API fetch...');
    
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const response = await fetch('https://cloud.lambdalabs.com/api/v1/instances', {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.LAMBDA_API_KEY + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const { data: instanceTypes } = await response.json() as LambdaResponse;
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';
    const matchResults = [];
    const unmatchedGPUs = [];

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

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
    
    // First, delete existing Lambda prices
    const { error: deleteError } = await supabaseAdmin
      .from('prices')
      .delete()
      .eq('provider_id', providerId);

    if (deleteError) {
      throw new Error(`Error deleting existing prices: ${deleteError.message}`);
    }

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
      unmatchedGPUs
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 