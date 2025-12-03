import { supabaseAdmin } from '@/lib/supabase-admin';

export interface TrendPoint {
  day: string;
  avgPricePerHour: number;
  providerCount: number;
}

interface FetchPriceTrendsParams {
  gpuId: string;
  days?: number;
}

export async function fetchPriceTrends({ gpuId, days = 30 }: FetchPriceTrendsParams): Promise<TrendPoint[]> {
  const boundedDays = Math.max(1, Math.min(days, 90));

  const { data, error } = await supabaseAdmin.rpc('get_gpu_daily_trends', {
    selected_gpu: gpuId,
    days: boundedDays
  });

  if (error) {
    throw error;
  }

  if (!data) return [];

  return data.map((row: any) => ({
    day: row.day,
    avgPricePerHour: Number(row.avg_price_per_hour),
    providerCount: Number(row.provider_count ?? 0)
  }));
}
