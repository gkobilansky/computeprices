import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';

// Helper function to extract GPU model number
function extractGPUModel(gpuName) {
  // Common GPU model patterns (A100, H100, 4090, etc)
  const modelPattern = /\b([A-H])?\d{2,4}[A-Za-z-]*\b/;
  const match = gpuName.match(modelPattern);
  return match ? match[0].toUpperCase() : null;
}

async function findMatchingGPUModel(gpuName, existingModels) {
  const gpuModel = extractGPUModel(gpuName);
  if (!gpuModel) return null;

  // Find exact model number match
  return existingModels.find(model => {
    const existingModel = extractGPUModel(model.name);
    return existingModel === gpuModel;
  });
}

async function scrapeCoreweaveGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting CoreWeave GPU scraper...');
    await page.goto('https://www.coreweave.com/gpu-cloud-pricing');
    await page.waitForSelector('.table');
    
    const providerId = '1d434a66-bf40-40a8-8e80-d5ab48b6d27f';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    // Scrape the GPU pricing table
    const gpuData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.table-body-row')).filter(row => {
        // All rows in this structure contain GPU data, so we don't need additional filtering
        return true;
      });

      return rows.map(row => {
        const nameElement = row.querySelector('.table-body-left a');
        const priceElement = row.querySelector('.w-col:last-child strong');
        
        if (!nameElement || !priceElement) return null;

        // Clean up the GPU name
        const name = nameElement.textContent.trim().toUpperCase();
        
        // Extract price, removing the "$" and "Reserve Now" text if present
        const priceText = priceElement.textContent.trim().split('\n')[0];
        const price = parseFloat(priceText.replace('$', ''));
        
        return {
          name,
          price,
        };
      }).filter(gpu => gpu && gpu.name && !isNaN(gpu.price));
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    if (dryRun) {
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    console.log('\n💾 Starting database updates...');
    const unmatchedGPUs = [];
    const timestamp = new Date().toISOString();
    
    for (const gpu of gpuData) {
      console.log(`\nProcessing ${gpu.name}:`);
      
      // Try to find a matching GPU model
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (!matchingModel) {
        unmatchedGPUs.push({
          name: gpu.name,
        });
        console.log(`⚠️ No matching GPU model found for ${gpu.name}`);
        continue;
      }

      console.log(`✅ Matched ${gpu.name} to ${matchingModel.name}`);

      // First, insert the new price record
      const { data: priceRecord, error: priceError } = await supabase
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: gpu.price,
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${gpu.name}:`, priceError);
        continue;
      }
    }

    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need to be added manually:');
      console.table(unmatchedGPUs);
    }

    console.log('\n✨ Successfully completed CoreWeave GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeCoreweaveGPUs(dryRun); 