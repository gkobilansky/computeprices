import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu.js';

async function scrapeVastGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Vast.ai GPU scraper...');
    await page.goto('https://vast.ai/pricing');
    
    // Wait for the pricing table to load
    await page.waitForSelector('table');

    const providerId = {
      vast: '4a4fdeae-7d4f-4d75-9967-54bbd498e4bf',
    };

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

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

        const prices = {
          vast: parseFloat(cells[1].textContent.replace('$', '')) || null,
          lambda: parseFloat(cells[2].textContent.replace('$', '')) || null,
          fluidstack: parseFloat(cells[3].textContent.replace('$', '')) || null,
          coreweave: parseFloat(cells[4].textContent.replace('$', '')) || null
        };

        return { name, prices };
      }).filter(row => row && row.prices.vast !== null);
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData.map(gpu => ({
      name: gpu.name,
      vast: gpu.prices.vast,
      lambda: gpu.prices.lambda,
      fluidstack: gpu.prices.fluidstack,
      coreweave: gpu.prices.coreweave
    })));

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
        unmatchedGPUs.push(gpu.name);
        console.log(`⚠️ No matching GPU model found for ${gpu.name}`);
        continue;
      }

      console.log(`✅ Matched ${gpu.name} to ${matchingModel.name}`);

      // Insert price records and update provider_gpus for each provider
      for (const [provider, price] of Object.entries(gpu.prices)) {
        if (price === null || !providerId[provider]) continue;

        // First, insert the new price record
        const { data: priceRecord, error: priceError } = await supabaseAdmin
          .from('prices')
          .insert({
            provider_id: providerId[provider],
            gpu_model_id: matchingModel.id,
            price_per_hour: price,
          })
          .select()
          .single();

        if (priceError) {
          console.error(`❌ Error inserting price record for ${gpu.name} (${provider}):`, priceError);
          continue;
        }
      }
    }

    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs that need to be added manually:');
      console.table(unmatchedGPUs);
    }

    console.log('\n✨ Successfully completed Vast.ai GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeVastGPUs(dryRun); 