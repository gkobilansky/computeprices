import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeRunPodGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Hyperstack GPU scraper...');
    await page.goto('https://www.hyperstack.cloud/gpu-pricing');
    await page.waitForSelector('.gpu-grd-pricing_first');
    
    const providerId = '54cc0c05-b0e6-49b3-95fb-831b36dd7efd';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    // Scrape the GPU cards
    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.gpu-grd-pricing_first .gpugpf-box-table table tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].innerText.trim();
        const vram = parseInt(cells[1].innerText.trim(), 10);
        const priceText = cells[4].innerText.trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        
        return {
          name,
          vram,
          price
        };
      }).filter(gpu => gpu && gpu.name && !isNaN(gpu.vram) && !isNaN(gpu.price));
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    // Initialize matching arrays
    const matchResults = [];
    const unmatchedGPUs = [];
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          vram: gpu.vram,
          price: gpu.price
        });
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          price: gpu.price
        });
      }
    }

    // Enhanced dry run output
    console.log('\n✅ Successfully Matched GPUs:');
    console.table(matchResults);
    
    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need manual attention:');
      console.table(unmatchedGPUs);
    }

    if (dryRun) {
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    // Database updates using matchResults array
    console.log('\n💾 Starting database updates...');
    
    for (const result of matchResults) {
      const matchingModel = await findMatchingGPUModel(result.scraped_name, existingModels);
      
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: result.price,
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.scraped_name}:`, priceError);
        continue;
      }
      
      console.log(`✅ Updated price for ${result.scraped_name}`);
    }

    console.log('\n✨ Successfully completed Hyperstack GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeRunPodGPUs(dryRun);
