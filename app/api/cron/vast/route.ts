import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

interface VastOffer {
  id: number;
  gpu_name: string;
  num_gpus: number;
  dph_total: number;
  reliability2: number;
  cuda_max_good: number;
  machine_id: number;
  has_avx: boolean;
  verification: string;
  external: boolean;
  rentable: boolean;
  rented: boolean;
}

interface VastResponse {
  offers: VastOffer[];
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Starting Vast.ai GPU API fetch...');

    // Check if API key exists
    const apiKey = process.env.VAST_API_KEY;
    if (!apiKey) {
      throw new Error('VAST_API_KEY environment variable is required');
    }

    console.log('API Key exists:', !!apiKey);

    // Search for offers with basic filters for verified, external, rentable machines
    const searchBody = {
      verified: {"eq": true},
      external: {"eq": true},
      rentable: {"eq": true},
      rented: {"eq": false},
      order: [["dph_total", "asc"]],
      type: "ask"
    };

    const response = await fetch('https://console.vast.ai/api/v0/bundles/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const responseData = await response.json() as VastResponse;
    console.log(`Received ${responseData.offers?.length || 0} offers`);
    
    const { offers } = responseData;
    if (!offers || offers.length === 0) {
      console.log('No offers found');
      return NextResponse.json({
        success: true,
        matched: 0,
        unmatched: 0,
        message: 'No offers found'
      });
    }
    
    const providerId = '4a4fdeae-7d4f-4d75-9967-54bbd498e4bf'; // Vast.ai provider ID
    const matchResults = [];
    const unmatchedGPUs = [];

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    console.log('📊 Processing GPU offers...');
    
    // Group offers by GPU name and find the best (lowest) price for each
    const gpuPriceMap = new Map<string, {
      gpu_name: string;
      best_price: number;
      gpu_count: number;
    }>();

    for (const offer of offers) {
      if (!offer.gpu_name || offer.dph_total <= 0) continue;
      
      // Skip unreliable or unavailable offers
      if (offer.reliability2 < 0.9 || offer.rented) continue;

      const gpuName = offer.gpu_name.trim().toUpperCase();
      const pricePerGpu = offer.dph_total / offer.num_gpus;
      
      const existing = gpuPriceMap.get(gpuName);
      if (!existing || pricePerGpu < existing.best_price) {
        gpuPriceMap.set(gpuName, {
          gpu_name: gpuName,
          best_price: pricePerGpu,
          gpu_count: 1 // Price is per GPU
        });
      }
    }

    console.log(`Found ${gpuPriceMap.size} unique GPU types`);

    // Process each unique GPU
    for (const gpuData of gpuPriceMap.values()) {
      const matchingModel = await findMatchingGPUModel(gpuData.gpu_name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpuData.gpu_name,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          price: gpuData.best_price,
          gpu_count: gpuData.gpu_count
        });
        console.log(`✅ Matched: ${gpuData.gpu_name} → ${matchingModel.name} at $${gpuData.best_price}/hr`);
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
          source_name: 'Vast.ai',
          source_url: 'https://cloud.vast.ai/?ref_id=236521'
        });

      if (priceError) {
        console.error(`Error inserting price for ${result.matched_name}:`, priceError);
      }
    }
,
    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults,
      unmatchedGPUs,
      totalOffers: offers.length,
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