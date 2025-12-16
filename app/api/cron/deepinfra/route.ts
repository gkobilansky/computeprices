import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';
import { getBrowserConfig, closeBrowser, BrowserInstance } from '@/lib/utils/puppeteer-config';

const DEEPINFRA_PROVIDER_ID = '0075753d-ed17-4904-b7e4-4e61849b252c';
const DEEPINFRA_GPU_URL = 'https://deepinfra.com/gpu-instances';

interface ScrapedGPU {
  name: string;
  vram: number;
  gpuCount: number;
  pricePerHour: number;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  gpu_model_id: string;
  vram: number;
  gpu_count: number;
  price_per_hour: number;
}

interface UnmatchedGPU {
  name: string;
  vram: number;
  gpu_count: number;
  price_per_hour: number;
}

export async function GET() {
  let browser: BrowserInstance | null = null;
  let isRemote = false;

  try {
    console.log('🔍 Starting Deep Infra GPU scraper...');

    const config = await getBrowserConfig();
    browser = config.browser;
    isRemote = config.isRemote;

    const page = await browser.newPage();

    await page.goto(DEEPINFRA_GPU_URL, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait for the pricing content to load
    await page.waitForSelector('table, [class*="price"], [class*="gpu"]', { timeout: 30000 });

    // Get existing GPU models
    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    // Scrape GPU data from the page
    const gpuData: ScrapedGPU[] = await (page as any).evaluate(() => {
      const results: ScrapedGPU[] = [];

      const normalizeText = (text?: string | null) =>
        (text || '')
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      // Try to find pricing tables or cards
      const tables = Array.from(document.querySelectorAll('table'));

      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tbody tr, tr'));

        for (const row of rows) {
          const cells = row.querySelectorAll('td, th');
          if (cells.length < 2) continue;

          const rowText = normalizeText(row.textContent);

          // Look for GPU names like A100, H100, H200, B200
          const gpuMatch = rowText.match(/(\d+)?\s*x?\s*(A100|H100|H200|B200|L40S?)[\s-]*(\d+)?\s*GB?/i);
          if (!gpuMatch) continue;

          // Extract price (look for dollar amounts)
          const priceMatch = rowText.match(/\$\s*([\d.]+)\s*(?:\/\s*(?:hr|hour))?/i);
          if (!priceMatch) continue;

          const gpuCount = gpuMatch[1] ? parseInt(gpuMatch[1], 10) : 1;
          const gpuName = gpuMatch[2].toUpperCase();
          const vram = gpuMatch[3] ? parseInt(gpuMatch[3], 10) : (gpuName === 'A100' ? 80 : gpuName === 'H100' ? 80 : gpuName === 'H200' ? 141 : gpuName === 'B200' ? 180 : 48);
          const totalPrice = parseFloat(priceMatch[1]);
          const pricePerGpu = totalPrice / gpuCount;

          if (pricePerGpu > 0 && pricePerGpu < 100) { // Sanity check
            results.push({
              name: `NVIDIA ${gpuName}`,
              vram,
              gpuCount,
              pricePerHour: pricePerGpu,
            });
          }
        }
      }

      // Also try to find pricing in divs/cards if table didn't work
      if (results.length === 0) {
        const allText = document.body.innerText;
        const lines = allText.split('\n');

        for (const line of lines) {
          const gpuMatch = line.match(/(\d+)?\s*x?\s*(A100|H100|H200|B200|L40S?)[\s-]*(\d+)?\s*GB?/i);
          const priceMatch = line.match(/\$\s*([\d.]+)\s*(?:\/\s*(?:hr|hour))?/i);

          if (gpuMatch && priceMatch) {
            const gpuCount = gpuMatch[1] ? parseInt(gpuMatch[1], 10) : 1;
            const gpuName = gpuMatch[2].toUpperCase();
            const vram = gpuMatch[3] ? parseInt(gpuMatch[3], 10) : (gpuName === 'A100' ? 80 : gpuName === 'H100' ? 80 : gpuName === 'H200' ? 141 : gpuName === 'B200' ? 180 : 48);
            const totalPrice = parseFloat(priceMatch[1]);
            const pricePerGpu = totalPrice / gpuCount;

            if (pricePerGpu > 0 && pricePerGpu < 100) {
              results.push({
                name: `NVIDIA ${gpuName}`,
                vram,
                gpuCount,
                pricePerHour: pricePerGpu,
              });
            }
          }
        }
      }

      // Deduplicate by GPU name, keeping the lowest price
      const uniqueGpus = new Map<string, ScrapedGPU>();
      for (const gpu of results) {
        const key = `${gpu.name}-${gpu.gpuCount}`;
        const existing = uniqueGpus.get(key);
        if (!existing || gpu.pricePerHour < existing.pricePerHour) {
          uniqueGpus.set(key, gpu);
        }
      }

      return Array.from(uniqueGpus.values());
    });

    console.log('📊 Scraped GPU Data:', gpuData);

    // Match GPUs with known models
    const matchResults: MatchResult[] = [];
    const unmatchedGPUs: UnmatchedGPU[] = [];

    for (const gpu of gpuData) {
      const matchingModel = await findMatchingGPUModel(gpu.name, existingModels);

      if (matchingModel) {
        matchResults.push({
          scraped_name: gpu.name,
          matched_model: matchingModel.name,
          gpu_model_id: matchingModel.id,
          vram: gpu.vram,
          gpu_count: gpu.gpuCount,
          price_per_hour: Number(gpu.pricePerHour.toFixed(4)),
        });
      } else {
        unmatchedGPUs.push({
          name: gpu.name,
          vram: gpu.vram,
          gpu_count: gpu.gpuCount,
          price_per_hour: Number(gpu.pricePerHour.toFixed(4)),
        });
      }
    }

    console.log(`✅ Matched ${matchResults.length} GPUs, ${unmatchedGPUs.length} unmatched.`);

    // Insert prices into database
    for (const result of matchResults) {
      const { error: priceError } = await supabaseAdmin.from('prices').insert({
        provider_id: DEEPINFRA_PROVIDER_ID,
        gpu_model_id: result.gpu_model_id,
        price_per_hour: result.price_per_hour,
        gpu_count: result.gpu_count,
        source_name: 'Deep Infra',
        source_url: DEEPINFRA_GPU_URL,
      });

      if (priceError) {
        console.error(`Error inserting price for ${result.scraped_name}:`, priceError);
      }
    }

    await closeBrowser(browser, isRemote);

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults: matchResults.map((r) => ({
        scraped_name: r.scraped_name,
        matched_model: r.matched_model,
        vram: `${r.vram}GB`,
        gpu_count: r.gpu_count,
        price: `$${r.price_per_hour}/hr`,
      })),
      unmatchedGPUs: unmatchedGPUs.map((g) => ({
        name: g.name,
        vram: `${g.vram}GB`,
        gpu_count: g.gpu_count,
        price: `$${g.price_per_hour}/hr`,
      })),
    });
  } catch (error) {
    console.error('Deep Infra scraper error:', error);
    await closeBrowser(browser, isRemote);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
