import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';

async function scrapeVastGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Vast.ai GPU scraper...');
    await page.goto('https://vast.ai/pricing');
    
    // Wait for the pricing table to load
    await page.waitForSelector('table');

    const providerId = {
      vast: '4a4fdeae-7d4f-4d75-9967-54bbd498e4bf', // Replace with actual Vast.ai provider ID
      lambda: '825cef3b-54f5-426e-aa29-c05fe3070833',
      fluidstack: 'a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182', // Replace with actual FluidStack provider ID
      coreweave: '1d434a66-bf40-40a8-8e80-d5ab48b6d27f' // Replace with actual CoreWeave provider ID
    };

    // Scrape the competitor comparison table
    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;

        // Extract GPU name from the first column
        const nameCell = cells[0].textContent.trim();
        const name = nameCell
          .replace(/[\[\]]/g, '')  // Remove square brackets
          .split('/')[0]           // Remove the URL part
          .trim()
          .toUpperCase();         // Normalize to uppercase

        // Extract prices for each provider
        const prices = {
          vast: parseFloat(cells[1].textContent.replace('$', '')) || null,
          lambda: parseFloat(cells[2].textContent.replace('$', '')) || null,
          fluidstack: parseFloat(cells[3].textContent.replace('$', '')) || null,
          coreweave: parseFloat(cells[4].textContent.replace('$', '')) || null
        };

        return { name, prices };
      }).filter(row => row && row.prices.vast !== null); // Filter out any invalid rows
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

    for (const gpu of gpuData) {
      console.log(`\nProcessing ${gpu.name}:`);

      // First, check/create GPU model
      const { data: gpuModel, error: gpuError } = await supabase
        .from('gpu_models')
        .upsert({
          name: gpu.name,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'name',
          returning: true
        })
        .select()
        .single();

      if (gpuError) {
        console.error(`❌ Error upserting GPU model ${gpu.name}:`, gpuError);
        continue;
      }
      console.log(`✅ GPU model ${gpu.name} processed`);

      // Update prices for each provider
      for (const [provider, price] of Object.entries(gpu.prices)) {
        if (price === null || !providerId[provider]) continue;

        const { error: providerGpuError } = await supabase
          .from('provider_gpus')
          .upsert({
            provider_id: providerId[provider],
            gpu_model_id: gpuModel.id,
            price_per_hour: price,
            available: true,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'provider_id,gpu_model_id',
            returning: true
          });

        if (providerGpuError) {
          console.error(`❌ Error upserting provider GPU for ${gpu.name} (${provider}):`, providerGpuError);
        } else {
          console.log(`✅ Provider GPU pricing updated for ${gpu.name} (${provider})`);
        }
      }
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