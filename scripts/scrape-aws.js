import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';

// Helper function to extract GPU model number
function extractGPUModel(gpuName) {
  // Handle AWS-specific GPU names (H100, A100, etc)
  const modelPattern = /([AH]\d{3})/i;
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

// Helper to parse memory string to GB
function parseMemory(memoryStr) {
  const match = memoryStr.match(/(\d+(?:\.\d+)?)\s*(GB|GiB|TB)/i);
  if (!match) return null;
  
  const [_, value, unit] = match;
  const numValue = parseFloat(value);
  
  if (unit.toLowerCase() === 'tb') {
    return numValue * 1024; // Convert TB to GB
  }
  return numValue;
}

async function scrapeAWSGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting AWS GPU scraper...');
    await page.goto('https://aws.amazon.com/ec2/capacityblocks/pricing/');
    
    const providerId = 'aws-provider-id'; // Replace with actual AWS provider ID

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabase
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    // Scrape the GPU pricing table
    const gpuData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr')).filter(row => {
        const cells = row.querySelectorAll('td');
        // Filter rows that have instance type and pricing information
        return cells.length >= 8 && cells[0].textContent.includes('p');
      });

      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        
        // Extract the hourly rate, removing the "$" and " USD"
        const rateText = cells[2].textContent.trim();
        const [instanceRate] = rateText.match(/\$(\d+\.\d+)/).map(x => parseFloat(x));
        
        // Extract accelerator info
        const acceleratorInfo = cells[3].textContent.trim();
        const [count, model] = acceleratorInfo.split('x').map(s => s.trim());
        
        return {
          instanceType: cells[0].textContent.trim(),
          region: cells[1].textContent.trim(),
          pricePerHour: instanceRate,
          gpuCount: parseInt(count),
          gpuModel: model,
          vCPUs: parseInt(cells[4].textContent.trim()),
          instanceMemory: cells[5].textContent.trim(),
          acceleratorMemory: cells[6].textContent.trim(),
          storage: cells[7].textContent.trim(),
          network: cells[8].textContent.trim()
        };
      });
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    if (dryRun) {
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    console.log('\n💾 Starting database updates...');
    const unmatchedGPUs = [];
    
    for (const gpu of gpuData) {
      console.log(`\nProcessing ${gpu.instanceType} with ${gpu.gpuModel}:`);
      
      // Try to find a matching GPU model
      const matchingModel = await findMatchingGPUModel(gpu.gpuModel, existingModels);
      
      if (!matchingModel) {
        unmatchedGPUs.push({
          name: gpu.gpuModel,
          vram: parseMemory(gpu.acceleratorMemory)
        });
        console.log(`⚠️ No matching GPU model found for ${gpu.gpuModel}`);
        continue;
      }

      console.log(`✅ Matched ${gpu.gpuModel} to ${matchingModel.name}`);

      // Calculate per-GPU price
      const pricePerGPU = gpu.pricePerHour / gpu.gpuCount;

      // Insert the new price record
      const { data: priceRecord, error: priceError } = await supabase
        .from('gpu_prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: pricePerGPU,
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${gpu.gpuModel}:`, priceError);
        continue;
      }

      // Update the provider_gpu record
      const { error: providerGpuError } = await supabase
        .from('provider_gpus')
        .upsert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          latest_price_id: priceRecord.id,
          available: true,
          regions: [gpu.region.toLowerCase()],
          specs: {
            maxVcpus: gpu.vCPUs,
            maxRam: parseMemory(gpu.instanceMemory),
            gpuMemory: parseMemory(gpu.acceleratorMemory),
            storage: gpu.storage,
            network: gpu.network,
            instanceType: gpu.instanceType
          },
          created_at: new Date().toISOString();
        }, {
          onConflict: 'provider_id,gpu_model_id',
          returning: true
        });

      if (providerGpuError) {
        console.error(`❌ Error upserting provider GPU for ${gpu.gpuModel}:`, providerGpuError);
      } else {
        console.log(`✅ Provider GPU pricing updated for ${gpu.gpuModel}`);
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