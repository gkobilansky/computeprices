import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';
import { runSafetyChecks } from '../lib/db-safety.js';

async function scrapeHyperstackGPUs(dryRun = false, skipSafetyChecks = false) {
  // Run safety checks unless explicitly skipped (e.g., when called from cron)
  if (!skipSafetyChecks && !dryRun) {
    await runSafetyChecks({
      operation: 'Hyperstack GPU Price Scraping',
      requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      allowProduction: true,
      args: process.argv
    });
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    console.log('🔍 Starting Hyperstack GPU scraper...');
    await page.goto('https://www.hyperstack.cloud/gpu-pricing', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    await page.waitForSelector('.page-price_card_row_item', { timeout: 60000 });
    
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
      const normalizeText = (text = '') =>
        text
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const cards = Array.from(document.querySelectorAll('.page-price_card'));
      const onDemandCard = cards.find(card => {
        const heading = normalizeText(card.querySelector('h3')?.textContent || '');
        return heading.toLowerCase().includes('on-demand gpu');
      });

      if (!onDemandCard) {
        return [];
      }

      const rows = onDemandCard.querySelectorAll('.page-price_card_row_item');

      return Array.from(rows)
        .map(row => {
          const cols = row.querySelectorAll('.page-price_card_row_item_col');
          const name = normalizeText(cols[0]?.textContent || '');
          const vramText = normalizeText(cols[1]?.textContent || '');
          const vram = parseInt(vramText.replace(/[^0-9.]/g, ''), 10);
          const priceTextRaw = normalizeText(
            (cols[4] ?? cols[cols.length - 1])?.textContent || ''
          );
          const price = parseFloat(priceTextRaw.replace(/[^0-9.]/g, ''));

          if (!name || Number.isNaN(vram) || Number.isNaN(price)) {
            return null;
          }

          return {
            name,
            vram,
            price,
          };
        })
        .filter(gpu => gpu && gpu.name && !Number.isNaN(gpu.vram) && !Number.isNaN(gpu.price));
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
          source_name: 'Hyperstack',
          source_url: 'https://www.hyperstack.cloud/gpu-pricing'
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

export default scrapeHyperstackGPUs;

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeHyperstackGPUs(dryRun);
