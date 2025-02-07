import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeDataCrunchGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting DataCrunch GPU scraper...');
    await page.goto('https://datacrunch.io/products');
    await page.waitForSelector('[data-slide-table]');
    
    const providerId = 'fd8bfdf8-162d-4a95-954d-ca4279edc46f';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    // Initialize matching arrays
    const matchResults = [];
    const unmatchedGPUs = [];

    // Scrape all GPU tables
    const gpuData = await page.evaluate(() => {
      const slides = document.querySelectorAll('[data-slide]');
      const gpus = [];

      slides.forEach(slide => {
        // Skip storage and CPU slides
        const header = slide.querySelector('h4');
        if (!header || header.textContent.includes('CPU') || header.textContent.includes('Storage')) {
          return;
        }

        const table = slide.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 8) return;

          const instanceName = cells[0].textContent.trim();
          const gpuModel = cells[1].textContent.trim();
          const gpuCount = parseInt(cells[2].textContent.trim());
          const vram = parseInt(cells[5].textContent.trim());
          const price = parseFloat(cells[7].textContent.trim().replace('$', '').replace('/h', ''));

          gpus.push({
            name: gpuModel,
            instanceName,
            gpuCount,
            vram,
            price: price / gpuCount // Price per GPU
          });
        });
      });

      return gpus;
    });

    // Process GPU matching before dry run check
    console.log('\n🔍 Processing GPU matches...');
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          instanceName: gpu.instanceName,
          gpuName: gpu.name,
          matchedModel: matchingModel.name,
          price: gpu.price,
          vram: gpu.vram,
          gpuCount: gpu.gpuCount
        });
      } else {
        unmatchedGPUs.push({
          instanceName: gpu.instanceName,
          gpuName: gpu.name,
          vram: gpu.vram,
          gpuCount: gpu.gpuCount
        });
      }
    }

    if (dryRun) {
      console.log('\n✅ Successfully matched GPUs:');
      console.table(matchResults);
      
      if (unmatchedGPUs.length > 0) {
        console.log('\n⚠️ GPUs requiring manual matching:');
        console.table(unmatchedGPUs);
      }
      
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    // Database updates using matchResults array
    console.log('\n💾 Starting database updates...');
    
    for (const result of matchResults) {
      console.log(`\nProcessing ${result.gpuName}:`);
      const matchingModel = await findMatchingGPUModel(result.gpuName, existingModels);
      
      const { data: priceRecord, error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: result.price,
          gpu_count: result.gpuCount,
          source_name: 'DataCrunch',
          source_url: 'https://datacrunch.io/products'
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.gpuName}:`, priceError);
        continue;
      }
    }

    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need to be added manually:');
      console.table(unmatchedGPUs);
    }

    console.log('\n✨ Successfully completed DataCrunch GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeDataCrunchGPUs(dryRun); 