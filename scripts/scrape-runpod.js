import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeRunPodGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting RunPod GPU scraper...');
    await page.goto('https://www.runpod.io/pricing');
    await page.waitForSelector('.MuiGrid-container');
    
    const providerId = '30a69dae-5939-499a-a4f5-5114797dcdb3';

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
      const cards = document.querySelectorAll('.MuiGrid-container .MuiGrid-item');
      
      return Array.from(cards).map(card => {
        // Get GPU name
        const nameElement = card.querySelector('.css-6ukrhs');
        if (!nameElement) return null;
        const name = nameElement.textContent.trim().toUpperCase();
        
        // Get VRAM
        const vramElement = card.querySelector('.css-1xqiyyp');
        const vramMatch = vramElement?.textContent.match(/(\d+)GB VRAM/);
        const vram = vramMatch ? parseInt(vramMatch[1]) : null;

        // Get GPU count
        const gpuCountElement = card.querySelector('.css-1xqiyyp');
        const gpuCountMatch = gpuCountElement?.textContent.match(/(\d+) vCPUs/);
        
        // Get prices for both Secure and Community Cloud
        const priceElements = card.querySelectorAll('.css-c16693');
        const prices = Array.from(priceElements).map(el => {
          return parseFloat(el.textContent.replace('$', ''));
        });

        
        // Get the lowest price
        const price = Math.min(...prices);
        
        return {
          name,
          vram,
          price,
        };
      }).filter(gpu => gpu && gpu.name && !isNaN(gpu.price));
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    // Initialize matching arrays
    const matchResults = [];
    const unmatchedGPUs = [];
    
    console.log('\n🔍 Matching GPUs with known models...');
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          price: gpu.price,
          gpu_model_id: matchingModel.id,
          vram: gpu.vram,

        });
        console.log(`✅ Matched ${gpu.name} to ${matchingModel.name}`);
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          price: gpu.price,
        });
        console.log(`⚠️ No matching GPU model found for ${gpu.name}`);
      }
    }

    // Enhanced dry run output
    console.log('\n📊 Matching Results Summary:');
    console.log(`Found ${matchResults.length} matches and ${unmatchedGPUs.length} unmatched GPUs`);
    
    if (unmatchedGPUs.length > 0) {
      console.log('\n⚠️ Unmatched GPUs:');
      console.table(unmatchedGPUs);
    }

    if (dryRun) {
      console.log('\n🏃 DRY RUN: Database updates preview');
      console.log('\nMatched GPUs that would be updated:');
      console.table(matchResults);
      return;
    }

    // Database updates using matchResults
    console.log('\n💾 Updating database with matched GPUs...');
    
    for (const match of matchResults) {
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: match.gpu_model_id,
          price_per_hour: match.price,
          source_name: 'RunPod',
          source_url: 'https://www.runpod.io/pricing'
        })
        .select()
        .single();

      if (priceError) {
        console.error(`❌ Error inserting price for ${match.scraped_name}:`, priceError);
        continue;
      }
    }

    console.log('\n✨ Successfully completed RunPod GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeRunPodGPUs(dryRun);
