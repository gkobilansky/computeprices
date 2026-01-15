import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';
import { runSafetyChecks } from '../lib/db-safety.js';

async function scrapeCoreweaveGPUs(dryRun = false, skipSafetyChecks = false) {
  // Run safety checks unless explicitly skipped (e.g., when called from cron)
  if (!skipSafetyChecks && !dryRun) {
    await runSafetyChecks({
      operation: 'CoreWeave GPU Price Scraping',
      requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      allowProduction: true,
      args: process.argv
    });
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    console.log('🔍 Starting CoreWeave GPU scraper...');
    await page.goto('https://www.coreweave.com/pricing', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForSelector('.table-v2.kubernetes-gpu-pricing', { timeout: 60000 });
    
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
      const rows = document.querySelectorAll('.kubernetes-gpu-pricing .table-row');

      const extractNumber = (text = '') => {
        const normalized = text.replace(/\s+/g, ' ').trim();
        const match = normalized.match(/\d+(?:,\d+)?/);
        return match ? parseInt(match[0].replace(/,/g, ''), 10) : null;
      };

      const getGpuCount = (cell) => {
        if (!cell) return 1;
        const supText = cell.querySelector('sup')?.textContent || '';
        const baseText = (cell.textContent || '').replace(supText, '');
        return extractNumber(baseText) ?? 1;
      };

      return Array.from(rows)
        .map(row => {
          const cells = row.querySelectorAll('.table-v2-cell');
          if (cells.length < 7) return null;

          const nameElement = row.querySelector('.table-model-name');
          if (!nameElement) return null;
          const name = nameElement.textContent?.trim().toUpperCase() || '';

          const gpuCount = getGpuCount(cells[1]);

          const priceText = cells[6]?.textContent || '';
          const totalPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));

          if (!name || Number.isNaN(totalPrice)) return null;

          return {
            name,
            price: totalPrice / Math.max(1, gpuCount),
            gpuCount,
          };
        })
        .filter(gpu => gpu && gpu.name && !Number.isNaN(gpu.price));
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
          price: gpu.price,
          gpuCount: gpu.gpuCount
        });
      } else {
        unmatchedGPUs.push({
          scraped_name: gpu.name,
          price: gpu.price,
          gpuCount: gpu.gpuCount
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
          gpu_count: result.gpuCount,
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
