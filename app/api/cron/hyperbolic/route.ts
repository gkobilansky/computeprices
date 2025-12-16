import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface HyperbolicVMOption {
  gpuCount: number;
  costPerHour: number;
}

interface MatchResult {
  scraped_name: string;
  gpu_model_id: string;
  matched_name: string;
  price: number;
  gpu_count: number;
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

    const response = await fetch('https://api.hyperbolic.xyz/v2/marketplace/virtual-machine-options', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const vmOptions = await response.json() as HyperbolicVMOption[];
    console.log(`Received ${vmOptions.length} VM options`);

    if (!vmOptions.length) {
      return NextResponse.json({
        success: true,
        matched: 0,
        message: 'No VM options found'
      });
    }

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Find single-GPU price (most accurate per-GPU rate)
    // V2 API returns H100 SXM pricing
    const singleGpuOption = vmOptions.find(opt => opt.gpuCount === 1);
    if (!singleGpuOption) {
      return NextResponse.json({
        success: true,
        matched: 0,
        message: 'No single-GPU option found'
      });
    }

    const gpuName = 'H100 SXM';
    const matchingModel = await findMatchingGPUModel(gpuName, existingModels);

    if (!matchingModel) {
      return NextResponse.json({
        success: true,
        matched: 0,
        unmatched: 1,
        unmatchedGPUs: [{ name: gpuName, price: singleGpuOption.costPerHour }]
      });
    }

    const matchResult: MatchResult = {
      scraped_name: gpuName,
      gpu_model_id: matchingModel.id,
      matched_name: matchingModel.name,
      price: singleGpuOption.costPerHour,
      gpu_count: 1
    };

    console.log(`✅ Matched: ${gpuName} → ${matchingModel.name} at $${singleGpuOption.costPerHour.toFixed(2)}/hr`);

    const { error: priceError } = await supabaseAdmin
      .from('prices')
      .insert({
        provider_id: providerId,
        gpu_model_id: matchingModel.id,
        price_per_hour: singleGpuOption.costPerHour,
        gpu_count: 1,
        source_name: 'Hyperbolic',
        source_url: 'https://app.hyperbolic.xyz/compute'
      });

    if (priceError) {
      console.error(`Error inserting price:`, priceError);
    }

    return NextResponse.json({
      success: true,
      matched: 1,
      matchResults: [matchResult],
      vmOptions
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
