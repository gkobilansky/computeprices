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

async function scrapeAWSGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting AWS GPU scraper...');
    await page.goto('https://aws.amazon.com/ec2/capacityblocks/pricing/');
    await page.waitForSelector('table');
    
    const providerId = '3bb5a379-472f-4c84-9ba4-3337f3922582';

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
      const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(1); // Skip header row
      
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;

        // Extract instance type and region
        const instanceType = cells[0].textContent.trim();
        const region = cells[1].textContent.trim();
        
        // Extract price - get the per accelerator price in parentheses
        const priceText = cells[2].textContent.trim();
        const priceMatch = priceText.match(/\((\$[\d.]+)/);
        if (!priceMatch) return null;
        const price = parseFloat(priceMatch[1].replace('$', ''));
        
        // Extract GPU info
        const acceleratorText = cells[3].textContent.trim();
        const [count, gpuModel] = acceleratorText.split('x').map(s => s.trim());
        const name = gpuModel.toUpperCase();
        
        // Extract memory info
        const acceleratorMemory = cells[6].textContent.trim();
        const memoryMatch = acceleratorMemory.match(/(\d+)\s*(?:GB|TB)/);
        const vram = memoryMatch ? parseInt(memoryMatch[1]) : null;

        return {
          instanceType,
          region,
          name,
          price,
          gpuCount: parseInt(count),
          vram
        };
      }).filter(gpu => gpu && !isNaN(gpu.price));
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
          instanceType: gpu.instanceType
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

    console.log('\n✨ Successfully completed AWS GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeAWSGPUs(dryRun);
