import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findMatchingGPUModel } from '@/lib/utils/gpu-scraping';

const DATACRUNCH_PROVIDER_ID = 'fd8bfdf8-162d-4a95-954d-ca4279edc46f';
const TOKEN_ENDPOINT = 'https://api.datacrunch.io/v1/oauth2/token';
const INSTANCE_TYPES_ENDPOINT = 'https://api.datacrunch.io/v1/instance-types';
const SOURCE_URL = 'https://api.datacrunch.io/v1/docs#tag/instance-types/GET/v1/instance-types';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface DataCrunchGPUField {
  description?: string;
  number_of_gpus?: number;
}

interface DataCrunchMemoryField {
  description?: string;
  size_in_gigabytes?: number;
  number_of_cores?: number;
}

interface DataCrunchInstance {
  id: string;
  instance_type: string;
  model?: string;
  name?: string;
  gpu?: DataCrunchGPUField | null;
  gpu_memory?: DataCrunchMemoryField | null;
  memory?: DataCrunchMemoryField | null;
  cpu?: DataCrunchMemoryField | null;
  price_per_hour?: string | number | null;
  currency?: string | null;
  [key: string]: unknown;
}

interface NormalizedInstance {
  instanceId: string;
  instanceType: string;
  gpuName: string;
  gpuCount: number;
  vram: number | null;
  pricePerGpuHour: number;
  pricePerInstanceHour: number;
  currency: string;
}

interface MatchResult {
  instanceId: string;
  instanceType: string;
  scraped_name: string;
  gpu_model_id: string;
  matched_name: string;
  price: number;
  gpu_count: number;
}

interface UnmatchedInstance {
  instanceId: string;
  instanceType: string;
  name: string;
  gpu_count: number;
  price: number;
}

function toNumber(value?: string | number | null): number | null {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeInstance(instance: DataCrunchInstance): NormalizedInstance | null {
  const currency = instance.currency?.toLowerCase() ?? 'usd';
  if (currency !== 'usd') {
    return null;
  }

  const gpuCount = instance.gpu?.number_of_gpus ?? 0;
  const pricePerInstance = toNumber(instance.price_per_hour);

  if (!gpuCount || gpuCount <= 0 || pricePerInstance === null) {
    return null;
  }

  const gpuName = (instance.model
    ?? instance.name
    ?? instance.gpu?.description
    ?? '').trim();

  if (!gpuName) {
    return null;
  }

  const pricePerGpuHour = pricePerInstance / gpuCount;

  return {
    instanceId: instance.id,
    instanceType: instance.instance_type,
    gpuName,
    gpuCount,
    vram: instance.gpu_memory?.size_in_gigabytes ?? null,
    pricePerGpuHour,
    pricePerInstanceHour: pricePerInstance,
    currency
  };
}

async function fetchAccessToken(clientId: string, clientSecret: string) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch DataCrunch access token (${response.status}): ${errorText}`);
  }

  const tokenJson = await response.json() as TokenResponse;
  if (!tokenJson.access_token) {
    throw new Error('DataCrunch access token missing from response');
  }

  return tokenJson.access_token;
}

async function fetchInstanceTypes(accessToken: string) {
  const response = await fetch(INSTANCE_TYPES_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch DataCrunch instance types (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Unexpected DataCrunch instance types payload');
  }

  return data as DataCrunchInstance[];
}

export async function GET(_request: Request) {
  try {
    console.log('🔍 Starting DataCrunch GPU API fetch...');

    const clientId = process.env.DATACRUNCH_CLIENT_ID;
    const clientSecret = process.env.DATACRUNCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing DATACRUNCH_CLIENT_ID or DATACRUNCH_CLIENT_SECRET');
    }

    console.log('Using client ID prefix:', clientId.slice(0, 4));
    const accessToken = await fetchAccessToken(clientId, clientSecret);
    console.log('Access token acquired (length):', accessToken.length);

    const instances = await fetchInstanceTypes(accessToken);
    console.log(`Fetched ${instances.length} instance types from DataCrunch`);

    const normalizedInstances = instances
      .map(normalizeInstance)
      .filter((instance): instance is NormalizedInstance => Boolean(instance));

    console.log(`Normalized ${normalizedInstances.length} GPU-enabled instances`);

    const { data: existingModels, error: modelsError } = await supabaseAdmin
      .from('gpu_models')
      .select('*');

    if (modelsError || !existingModels) {
      throw new Error(`Error fetching GPU models: ${modelsError?.message || 'No data returned'}`);
    }

    const matchResults: MatchResult[] = [];
    const unmatchedInstances: UnmatchedInstance[] = [];

    for (const instance of normalizedInstances) {
      const matchingModel = await findMatchingGPUModel(instance.gpuName, existingModels);

      if (matchingModel) {
        matchResults.push({
          instanceId: instance.instanceId,
          instanceType: instance.instanceType,
          scraped_name: instance.gpuName,
          gpu_model_id: matchingModel.id,
          matched_name: matchingModel.name,
          price: instance.pricePerGpuHour,
          gpu_count: instance.gpuCount
        });

        const { error: priceError } = await supabaseAdmin
          .from('prices')
          .insert({
            provider_id: DATACRUNCH_PROVIDER_ID,
            gpu_model_id: matchingModel.id,
            price_per_hour: instance.pricePerGpuHour,
            gpu_count: instance.gpuCount,
            source_name: 'DataCrunch API',
            source_url: SOURCE_URL
          });

        if (priceError) {
          console.error(`Error inserting price for ${matchingModel.name}:`, priceError);
        }
      } else {
        unmatchedInstances.push({
          instanceId: instance.instanceId,
          instanceType: instance.instanceType,
          name: instance.gpuName,
          gpu_count: instance.gpuCount,
          price: instance.pricePerGpuHour
        });
        console.warn(`❌ Unmatched GPU model: ${instance.gpuName}`);
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchResults.length,
      unmatched: unmatchedInstances.length,
      totals: {
        rawInstances: instances.length,
        normalizedInstances: normalizedInstances.length
      },
      matchResults,
      unmatchedInstances
    });

  } catch (error) {
    console.error('DataCrunch cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
