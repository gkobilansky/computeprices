import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { findMatchingGPUModel } from '../lib/utils/gpu-scraping.js';

async function scrapeLambdaGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Lambda Labs GPU scraper...');
    await page.goto('https://lambdalabs.com/service/gpu-cloud#pricing');
    await page.waitForSelector('table');
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';
    const matchResults = [];
    const unmatchedGPUs = [];

    // Get existing GPU models first
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      console.error('Error fetching existing GPU models:', modelsError);
      return;
    }

    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return null;
        
        const fullName = cells[0].textContent.trim();
        const name = fullName
          .replace(/^(On-demand|Reserved)\s+\d+x\s+/, '')
          .trim()
          .toUpperCase();
        
        const gpuCountMatch = fullName.match(/(\d+)x/);
        const gpuCount = gpuCountMatch ? parseInt(gpuCountMatch[1]) : 1;
        
        const vramText = cells[1].textContent.trim();
        const vram = parseInt(vramText.replace('GB', ''));
        
        const priceText = cells[5].textContent.trim();
        const price = parseFloat(priceText.replace('$', '').split('/')[0]);
        
        return { name, gpuCount, vram, price };
      })
      .filter(row => row && !isNaN(row.price) && row.price !== null);
    });

    console.log('\n📊 Scraped GPU Data:');
    console.table(gpuData);

    console.log('\n🔍 Matching GPUs with known models...');
    
    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);
      
      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          vram: gpu.vram,
          price: gpu.price,
          gpu_count: gpu.gpuCount
        });
        console.log(`✅ Matched: ${gpu.name} → ${matchingModel.name}`);
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          gpu_count: gpu.gpuCount,
          price: gpu.price
        });
        console.log(`❌ Unmatched: ${gpu.name}`);
      }
    }

    if (dryRun) {
      console.log('\n🏃 DRY RUN RESULTS:');
      console.log('\n✅ Matched GPUs:');
      console.table(matchResults.map(r => ({
        scraped: r.scraped_name,
        matched: r.matched_name,
        price: `$${r.price}/hr`,
        count: r.gpu_count
      })));
      
      if (unmatchedGPUs.length > 0) {
        console.log('\n❌ Unmatched GPUs:');
        console.table(unmatchedGPUs);
      }
      return;
    }

    console.log('\n💾 Starting database updates...');
    for (const result of matchResults) {
      console.log(`\nProcessing ${result.matched_name}:`);
      
      const { error: priceError } = await supabaseAdmin
        .from('prices')
        .insert({
          provider_id: providerId,
          gpu_model_id: result.gpu_model_id,
          price_per_hour: result.price,
          gpu_count: result.gpu_count,
          source_name: 'Lambda Labs',
          source_url: 'https://lambdalabs.com/service/gpu-cloud#pricing'
        });

      if (priceError) {
        console.error(`❌ Error inserting price record for ${result.matched_name}:`, priceError);
        continue;
      }
    }

    console.log('\n✅ Successfully completed Lambda Labs GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeLambdaGPUs(dryRun); 