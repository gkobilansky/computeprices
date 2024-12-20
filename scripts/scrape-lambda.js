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

async function scrapeLambdaGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Lambda Labs GPU scraper...');
    await page.goto('https://lambdalabs.com/service/gpu-cloud#pricing');
    await page.waitForSelector('table');
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return null;
        
        const fullName = cells[0].textContent.trim();
        const name = fullName
          .replace(/^(On-demand|Reserved)\s+\d+x\s+/, '')
          .trim()
          .toUpperCase();
        
        const gpuCountMatch = fullName.match(/(\d+)x/);
        const gpuCount = gpuCountMatch ? parseInt(gpuCountMatch[1]) : 1;
        
        const vramText = cells[1].textContent.trim();
        const vram = parseInt(vramText.replace('GB', ''));
        
        const priceText = cells[5].textContent.trim();
        const price = parseFloat(priceText.replace('$', '').split('/')[0]);
        
        return { name, gpuCount, vram, price };
      })
      .filter(row => row && !isNaN(row.price) && row.price !== null);
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
          vram: gpu.vram,
          gpuCount: gpu.gpuCount
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

    console.log('\n✨ Successfully completed Lambda Labs GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeLambdaGPUs(dryRun); 