import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';
import { runSafetyChecks } from '../lib/db-safety.js';

async function scrapeVastGPUs(dryRun = false, skipSafetyChecks = false) {
  // Run safety checks unless explicitly skipped (e.g., when called from cron)
  if (!skipSafetyChecks && !dryRun) {
    await runSafetyChecks({
      operation: 'Vast.ai GPU Price Scraping',
      requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      allowProduction: true,
      args: process.argv
    });
  }

  console.log('🔍 Starting Vast.ai GPU scraper...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Vast.ai GPU scraper...');
    await page.goto('https://vast.ai/pricing');
    
    // Wait for the pricing table to load
    await page.waitForSelector('table');

    const vastProviderId = '4a4fdeae-7d4f-4d75-9967-54bbd498e4bf';

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    // Initialize tracking arrays
    const matchResults = [];
    const unmatchedGPUs = [];

    // Scrape the competitor comparison table
    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;

        const nameCell = cells[0].textContent.trim();
        const name = nameCell
          .replace(/[\[\]]/g, '')
          .split('/')[0]
          .trim()
          .toUpperCase();

        const price = parseFloat(cells[2].textContent.replace('$', ''));

        return { name, price, source_name: 'Vast.ai', source_url: 'https://cloud.vast.ai/?ref_id=236521' };
      }).filter(row => row && row.price !== null);
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData.map(gpu => ({
      name: gpu.name,
      price: gpu.price,
      provider_id: vastProviderId,
      source_name: gpu.source_name,
      source_url: gpu.source_url
    })));

    // Process GPU matches before dry run check
    console.log('\n🔍 Processing GPU matches...');
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped: gpu.name,
          matched: matchingModel.name,
          price: gpu.price,
          gpu_count: 1
        });
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          price: gpu.price,
        });
      }
    }

    // Enhanced dry run output
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
    for (const result of matchResults) {
      const gpu = gpuData.find(g => g.name === result.scraped);
      const matchingModel = existingModels.find(m => m.name === result.matched);

      if (gpu.price === null) continue;

      // First, insert the new price record
      const { data: priceRecord, error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: vastProviderId,
          gpu_model_id: matchingModel.id,
          price_per_hour: gpu.price,
          source_name: 'Vast.ai',
          source_url: 'https://cloud.vast.ai/?ref_id=236521'
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${gpu.name} Vast.ai:`, priceError);
        continue;
      }

      console.log(priceRecord);
    }

    console.log('\n✨ Successfully completed Vast.ai GPU data processing');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

export default scrapeVastGPUs;

// Execute the script if running directly
const isDryRun = process.argv.includes('--dry-run');
scrapeVastGPUs(isDryRun);
