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

async function scrapeFluidstackGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting FluidStack GPU scraper...');
    await page.goto('https://www.fluidstack.io/pricing');
    await page.waitForSelector('.pricing_table');
    
    const providerId = 'a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182';

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
      const rows = Array.from(document.querySelectorAll('.pricing_body tr'));
      
      return rows.map(row => {
        const nameElement = row.querySelector('.table-header-mobile');
        const onDemandElement = row.querySelector('td:nth-child(5) p');
        
        if (!nameElement || !onDemandElement) return null;

        const name = nameElement.textContent.trim().toUpperCase();
        const priceText = onDemandElement?.textContent.trim();
        // Only include GPUs with valid on-demand pricing (skip "n/a")
        if (priceText === 'n/a') return null;
        
        const price = parseFloat(priceText?.replace('$', ''));
        
        return {
          name,
          price
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
          vram: gpu.vram
        });
        console.log(`⚠️ No matching GPU model found for ${gpu.name}`);
        continue;
      }

      console.log(`✅ Matched ${gpu.name} to ${matchingModel.name}`);

      // Insert the new price record
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

    console.log('\n✨ Successfully completed FluidStack GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeFluidstackGPUs(dryRun);
