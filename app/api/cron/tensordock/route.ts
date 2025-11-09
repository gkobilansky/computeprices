import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

const TENSORDOCK_API_URL =
  'https://dashboard.tensordock.com/api/v0/client/deploy/hostnodes?minGPUCount=1&requiresRTX=false&requiresGTX=false';
const TENSORDOCK_PROVIDER_ID = 'e59fd1e8-2706-4c21-a9fd-a63ef9386b24';

interface TensorDockGPUDetails {
  amount: number;
  price: number;
  vram?: number;
  rtx?: boolean;
  gtx?: boolean;
  pcie?: boolean;
}

interface TensorDockHostNodeSpecs {
  gpu?: Record<string, TensorDockGPUDetails>;
  cpu?: {
    amount: number;
    price: number;
    type: string;
  };
  ram?: {
    amount: number;
    price: number;
  };
}

interface TensorDockHostNode {
  specs?: TensorDockHostNodeSpecs;
  location?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

interface TensorDockResponse {
  hostnodes?: Record<string, TensorDockHostNode>;
  success: boolean;
}

interface MatchResult {
  scraped_name: string;
  matched_model: string;
  gpu_model_id: string;
  price_per_hour: number;
  gpu_count: number;
  node_id: string;
  location?: string;
}

interface UnmatchedGPU {
  name: string;
  gpu_count: number;
  price_per_hour: number;
  node_id: string;
  location?: string;
}

function formatTensorDockGPUName(slug: string): string {
  const IGNORED_TOKENS = ['PCIE', 'PCIE3', 'PCIE4', 'PCIE5', 'NVLINK'];
  const sanitizedSlug = slug.replace(/_/g, '-').toUpperCase();
  const tokens = sanitizedSlug
    .split('-')
    .filter(Boolean)
    .filter((token) => !IGNORED_TOKENS.some((ignored) => token.includes(ignored)));

  if (tokens.length === 0) {
    return sanitizedSlug.replace(/-/g, ' ').trim();
  }

  let name = tokens.join(' ');
  name = name.replace(/GEFORCE/g, '').replace(/NVIDIA/g, '').trim();

  name = name
    .replace(/\bRTX(?=[A-Z])/g, 'RTX ')
    .replace(/\bGTX(?=[A-Z])/g, 'GTX ')
    .replace(/\bRTX(?=\d)/g, 'RTX ')
    .replace(/\bGTX(?=\d)/g, 'GTX ')
    .replace(/\bTESLA(?=[A-Z0-9])/g, 'TESLA ');

  name = name
    .replace(/\s+/g, ' ')
    .replace(/\b(\d+)(GB)\b/g, '$1$2')
    .trim();

  return name || slug.toUpperCase();
}

export async function GET() {
  try {
    console.log('🔍 Fetching TensorDock hostnodes...');

    const response = await fetch(TENSORDOCK_API_URL, { cache: 'no-store' });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`TensorDock API request failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as TensorDockResponse;
    const hostnodes = data.hostnodes ?? {};

    const { data: existingModels, error: modelsError } = await supabaseAdmin.from('gpu_models').select('*');

    if (modelsError) {
      throw new Error(`Error fetching GPU models: ${modelsError.message}`);
    }

    const matchResults: MatchResult[] = [];
    const unmatchedGPUs: UnmatchedGPU[] = [];

    for (const [nodeId, node] of Object.entries(hostnodes)) {
      const gpuEntries = node.specs?.gpu ?? {};
      const locationParts =
        [node.location?.city, node.location?.region, node.location?.country].filter(Boolean).join(', ') ||
        undefined;

      for (const [slug, details] of Object.entries(gpuEntries)) {
        if (!details || details.amount <= 0 || !Number.isFinite(details.price)) {
          continue;
        }

        const pricePerGPU = details.price / Math.max(details.amount, 1);
        if (!Number.isFinite(pricePerGPU) || pricePerGPU <= 0) {
          continue;
        }

        const readableName = formatTensorDockGPUName(slug);
        const targetName = readableName || slug.toUpperCase();

        const matchingModel = existingModels && targetName ? await findMatchingGPUModel(targetName, existingModels) : null;

        if (matchingModel) {
          matchResults.push({
            scraped_name: targetName,
            matched_model: matchingModel.name,
            gpu_model_id: matchingModel.id,
            price_per_hour: Number(pricePerGPU.toFixed(6)),
            gpu_count: details.amount,
            node_id: nodeId,
            location: locationParts,
          });
        } else {
          unmatchedGPUs.push({
            name: targetName,
            gpu_count: details.amount,
            price_per_hour: Number(pricePerGPU.toFixed(6)),
            node_id: nodeId,
            location: locationParts,
          });
        }
      }
    }

    console.log(`✅ Matched ${matchResults.length} GPU entries, ${unmatchedGPUs.length} unmatched.`);

    for (const result of matchResults) {
      const { error: priceError } = await supabaseAdmin.from('prices').insert({
        provider_id: TENSORDOCK_PROVIDER_ID,
        gpu_model_id: result.gpu_model_id,
        price_per_hour: result.price_per_hour,
        gpu_count: result.gpu_count,
        source_name: 'TensorDock API',
        source_url: TENSORDOCK_API_URL,
      });

      if (priceError) {
        console.error(`Error inserting price for ${result.scraped_name} (${result.node_id}):`, priceError);
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedGPUs.length,
      matchResults,
      unmatchedGPUs,
    });
  } catch (error) {
    console.error('TensorDock cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
