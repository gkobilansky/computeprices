import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeAWSGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting AWS GPU scraper...');
    await page.goto('https://aws.amazon.com/ec2/capacityblocks/pricing/');
    await page.waitForSelector('table');
    
    const providerId = '3bb5a379-472f-4c84-9ba4-3337f3922582';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
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

    // New matching logic moved before dry run check
    console.log('\n🔍 Analyzing GPU matches...');
    const matchResults = [];
    const unmatchedGPUs = [];
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          instance_type: gpu.instanceType,
          gpu_count: gpu.gpuCount,
          price: `$${gpu.price}/hr`
        });
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          instance_type: gpu.instanceType
        });
      }
    }

    console.log('\n✅ Successfully matched GPUs:');
    console.table(matchResults);

    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need attention:');
      console.table(unmatchedGPUs);
    }

    if (dryRun) {
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    // Database updates using matchResults array
    console.log('\n💾 Starting database updates...');
    const timestamp = new Date().toISOString();
    
    for (const result of matchResults) {
      const gpu = gpuData.find(g => g.name === result.scraped_name);
      const matchingModel = existingModels.find(m => m.name === result.matched_model);
      
      console.log(`\nProcessing ${result.scraped_name}:`);
      console.log(`✅ Using matched model: ${result.matched_model}`);

      // Insert the new price record
      const { data: priceRecord, error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: gpu.price,
          gpu_count: gpu.gpuCount,
          source_name: 'AWS',
          source_url: 'https://aws.amazon.com/ec2/capacityblocks/pricing/'
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${gpu.name}:`, priceError);
        continue;
      }
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
