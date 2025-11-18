import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

const SALAD_PROVIDER_ID = '46f0b708-7a4b-453b-8c0e-d57f9f304265';
const SALAD_ORGANIZATION = 'lansky-tech';
const SALAD_API_ENDPOINT = `https://api.salad.com/api/public/organizations/${SALAD_ORGANIZATION}/gpu-classes`;
const SALAD_SOURCE_URL = 'https://docs.salad.com/reference/saladcloud-api/organizations/list-gpu-classes';

interface SaladPrice {
  priority: string;
  price: string | number;
}

interface SaladGPUClass {
  id: string;
  name: string;
  prices: SaladPrice[];
  is_high_demand?: boolean;
  gpu_class_type?: string;
}

interface SaladResponse {
  items: SaladGPUClass[];
}

interface NormalizedGPUClass {
  id: string;
  name: string;
  price: number;
  priority: string;
  classType?: string;
  isHighDemand?: boolean;
}

interface MatchResult {
  classId: string;
  scraped_name: string;
  gpu_model_id: string;
  matched_name: string;
  price: number;
  gpu_count: number;
  priority: string;
}

interface UnmatchedGPUClass {
  classId: string;
  name: string;
  price: number;
  priority: string;
}

function toNumber(value: string | number | undefined) {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const sanitized = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(sanitized) ? sanitized : null;
}

function selectLowestPrice(prices: SaladPrice[]) {
  const normalized = prices
    .map(price => ({
      priority: price.priority,
      price: toNumber(price.price)
    }))
    .filter((entry): entry is { priority: string; price: number } => typeof entry.price === 'number')
    .sort((a, b) => a.price - b.price);

  return normalized[0] ?? null;
}

function normalizeSaladClasses(items: SaladGPUClass[]) {
  const normalized: NormalizedGPUClass[] = [];

  for (const item of items) {
    if (!item?.name || !Array.isArray(item.prices) || item.prices.length === 0) {
      continue;
    }

    const bestPrice = selectLowestPrice(item.prices);
    if (!bestPrice) {
      continue;
    }

    normalized.push({
      id: item.id,
      name: item.name,
      price: bestPrice.price,
      priority: bestPrice.priority,
      classType: item.gpu_class_type,
      isHighDemand: item.is_high_demand
    });
  }

  return normalized;
}

async function fetchSaladGPUClasses(apiKey: string) {
  const response = await fetch(SALAD_API_ENDPOINT, {
    headers: {
      'Salad-Api-Key': apiKey
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Salad GPU classes (${response.status}): ${errorText}`);
  }

  const json = await response.json() as SaladResponse;

  if (!Array.isArray(json.items)) {
    throw new Error('Unexpected Salad GPU classes response payload');
  }

  return json.items;
}

export async function GET(_request: Request) {
  try {
    console.log('🔍 Starting Salad GPU API fetch...');

    const apiKey = process.env.SALAD_API_KEY;
    if (!apiKey) {
      throw new Error('Missing SALAD_API_KEY');
    }

    const gpuClasses = await fetchSaladGPUClasses(apiKey);
    console.log(`Fetched ${gpuClasses.length} GPU classes from Salad`);

    const normalizedClasses = normalizeSaladClasses(gpuClasses);
    console.log(`Normalized ${normalizedClasses.length} GPU classes with valid pricing`);

    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError || !existingModels) {
      throw new Error(`Error fetching GPU models: ${modelsError?.message || 'No data returned'}`);
    }

    const matchResults: MatchResult[] = [];
    const unmatchedClasses: UnmatchedGPUClass[] = [];

    for (const gpuClass of normalizedClasses) {
      const matchingModel = await findMatchingGPUModel(gpuClass.name, existingModels);

      if (matchingModel) {
        matchResults.push({
          classId: gpuClass.id,
          scraped_name: gpuClass.name,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          price: gpuClass.price,
          gpu_count: 1,
          priority: gpuClass.priority
        });

        const { error: priceError } = await supabaseAdmin
          .from('prices')
          .insert({
            provider_id: SALAD_PROVIDER_ID,
            gpu_model_id: matchingModel.id,
            price_per_hour: gpuClass.price,
            gpu_count: 1,
            source_name: `Salad API (${gpuClass.priority} priority)`,
            source_url: SALAD_SOURCE_URL
          });

        if (priceError) {
          console.error(`Error inserting price for ${matchingModel.name}:`, priceError);
        }
      } else {
        unmatchedClasses.push({
          classId: gpuClass.id,
          name: gpuClass.name,
          price: gpuClass.price,
          priority: gpuClass.priority
        });
        console.warn(`❌ Unmatched Salad GPU class: ${gpuClass.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedClasses.length,
      totals: {
        rawClasses: gpuClasses.length,
        normalizedClasses: normalizedClasses.length
      },
      matchResults,
      unmatchedClasses
    });
  } catch (error) {
    console.error('Salad cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
