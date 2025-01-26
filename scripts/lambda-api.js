import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function scrapeLambdaGPUs(dryRun = false) {
  try {
    console.log('🔍 Starting Lambda Labs GPU API fetch...');
    
    const apiKey = process.env.LAMBDA_API_KEY;
    if (!apiKey) {
      throw new Error('LAMBDA_API_KEY not found in environment variables');
    }

    const response = await fetch('https://cloud.lambdalabs.com/api/v1/instances', {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const { data: instanceTypes } = await response.json();
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';
    const matchResults = [];
    const unmatchedGPUs = [];

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    console.log('\n📊 Processing GPU Data...');
    
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

    if (dryRun) {
      console.log('\n🏃 DRY RUN RESULTS:');
      console.log('\n✅ Matched GPUs:');
      console.table(matchResults.map(r => ({
        scraped: r.scraped_name,
        matched: r.matched_name,
        price: `$${r.price}/hr`,
        count: r.gpu_count
      })));
      
      if (unmatchedGPUs.length > 0) {
        console.log('\n❌ Unmatched GPUs:');
        console.table(unmatchedGPUs);
      }
      return;
    }

    console.log('\n💾 Starting database updates...');
    for (const result of matchResults) {
      console.log(`\nProcessing ${result.matched_name}:`);
      
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: result.gpu_model_id,
          price_per_hour: result.price,
          gpu_count: result.gpu_count
        });

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.matched_name}:`, priceError);
        continue;
      }
    }

    console.log('\n✅ Successfully completed Lambda Labs GPU data processing');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeLambdaGPUs(dryRun); 