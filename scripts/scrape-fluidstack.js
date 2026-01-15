import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';
import { runSafetyChecks } from '../lib/db-safety.js';

async function scrapeFluidstackGPUs(dryRun = false, skipSafetyChecks = false) {
  // Run safety checks unless explicitly skipped (e.g., when called from cron)
  if (!skipSafetyChecks && !dryRun) {
    await runSafetyChecks({
      operation: 'FluidStack GPU Price Scraping',
      requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      allowProduction: true,
      args: process.argv
    });
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    console.log('🔍 Starting FluidStack GPU scraper...');
    await page.goto('https://www.fluidstack.io/pricing');
    await page.waitForSelector('.pricing_table');
    
    const providerId = 'a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182';

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

    // Initialize matching arrays
    const matchResults = [];
    const unmatchedGPUs = [];

    // Move matching logic before dry run check
    console.log('\n🔍 Analyzing GPU matches...');
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          gpu_model_id: matchingModel.id,
          price: gpu.price,
          source_name: 'FluidStack',
          source_url: 'https://www.fluidstack.io/pricing'
        });
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          price: gpu.price
        });
      }
    }

    // Enhanced dry run output
    console.log('\n✅ Successfully matched GPUs:');
    console.table(matchResults.map(r => ({
      scraped_name: r.scraped_name,
      matched_model: r.matched_model,
      price: `$${r.price}/hr`
    })));

    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need attention:');
      console.table(unmatchedGPUs.map(g => ({
        name: g.name,
        price: `$${g.price}/hr`
      })));
    }

    if (dryRun) {
      console.log('\n🏃 DRY RUN: No database updates will be performed');
      return;
    }

    // Database updates using matchResults array
    console.log('\n💾 Starting database updates...');
    
    for (const result of matchResults) {
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: result.gpu_model_id,
          price_per_hour: result.price,
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.scraped_name}:`, priceError);
        continue;
      }
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
