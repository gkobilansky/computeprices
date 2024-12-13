import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';

async function scrapeLambdaGPUs(dryRun = false) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting Lambda Labs GPU scraper...');
    await page.goto('https://lambdalabs.com/service/gpu-cloud#pricing');
    await page.waitForSelector('table');
    
    const providerId = '825cef3b-54f5-426e-aa29-c05fe3070833';

    const gpuData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return null;
        
        const fullName = cells[0].textContent.trim();
        const name = fullName
          .replace(/^(On-demand|Reserved)\s+\d+x\s+/, '')
          .trim();
        
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
          vram: gpu.vram,
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

      // Then create/update the provider_gpu entry
      const { error: providerGpuError } = await supabase
        .from('provider_gpus')
        .upsert({
          provider_id: providerId,
          gpu_model_id: gpuModel.id,
          price_per_hour: gpu.price,
          available: true,
          regions: ['us-east-1'],
          min_hours: 1,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'provider_id,gpu_model_id',
          returning: true
        });

      if (providerGpuError) {
        console.error(`❌ Error upserting provider GPU for ${gpu.name}:`, providerGpuError);
      } else {
        console.log(`✅ Provider GPU pricing updated for ${gpu.name}`);
      }
    }

    console.log('\n✨ Successfully completed Lambda Labs GPU data processing');

  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await browser.close();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
scrapeLambdaGPUs(dryRun); 