import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeCoreweaveGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting CoreWeave GPU scraper...');
    await page.goto('https://www.coreweave.com/pricing');
    await page.waitForSelector('.table-v2.kubernetes-gpu-pricing');
    
    const providerId = '1d434a66-bf40-40a8-8e80-d5ab48b6d27f';

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
      console.log('Scraping CoreWeave GPU pricing table...');
      const rows = document.querySelectorAll('.kubernetes-gpu-pricing .table-cell-column.table-cell-column-left');
      const priceRows = Array.from(rows).filter(row => {
        // Ensure the row contains the specific elements for name and price
        const hasName = row.querySelector('a.table-modal-link .table-model-name');
        const hasPrice = row.querySelector('.table-meta-text .table-meta-value');
        return hasName && hasPrice;
      });

      return priceRows.map(row => {
        const nameElement = row.querySelector('a.table-modal-link .table-model-name');
        const priceElement = row.querySelector('.table-meta-text .table-meta-value');
        
        if (!nameElement || !priceElement) return null;

        // Clean up the GPU name
        const name = nameElement.textContent.trim().toUpperCase();
        
        // Extract price, removing the "$" and any other text
        const priceText = priceElement.textContent.trim();
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        return {
          name,
          price,
        };
      }).filter(gpu => gpu && gpu.name && !isNaN(gpu.price));
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    // Move GPU matching logic before dry run check
    console.log('\n🔍 Matching GPUs with known models...');
    const matchResults = [];
    const unmatchedGPUs = [];
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          price: gpu.price
        });
      } else {
        unmatchedGPUs.push({
          scraped_name: gpu.name,
          price: gpu.price
        });
      }
    }

    // Enhanced dry run output
    if (dryRun) {
      console.log('\n🏃 DRY RUN MODE - Database updates will be skipped');
      console.log('\n✅ Successfully matched GPUs:');
      console.table(matchResults);
      
      if (unmatchedGPUs.length > 0) {
        console.log('\n⚠️ Unmatched GPUs requiring manual review:');
        console.table(unmatchedGPUs);
      }
      return;
    }

    // Database update logic
    console.log('\n💾 Starting database updates...');
    
    for (const result of matchResults) {
      console.log(`\nProcessing ${result.scraped_name}:`);
      const matchingModel = await findMatchingGPUModel(result.scraped_name, existingModels);
      
      // First, insert the new price record
      const { data: priceRecord, error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: matchingModel.id,
          price_per_hour: result.price,
          source_name: 'CoreWeave',
          source_url: 'https://www.coreweave.com/pricing'
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.scraped_name}:`, priceError);
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