'use client';

import { useMemo } from 'react';
import { useGPUData } from '@/lib/hooks/useGPUData';
import Superlatives from '@/components/Superlatives';
import TopPickTrends from '@/components/TopPickTrends';

const defaultCheapest = { provider: '...', gpu: '...', price: 0, provider_id: null, gpu_model_id: null };
const defaultMostPopular = { name: '...', id: null };

const normalizeB200Name = (name) => {
  if (!name) return null;
  const upper = name.toUpperCase();
  return upper.includes('B200') ? name : null;
};

const deriveTopPicks = (gpuData = []) => {
  if (!Array.isArray(gpuData) || gpuData.length === 0) {
    return {
      cheapest: defaultCheapest,
      mostPopular: defaultMostPopular,
      topLine: { name: 'NVIDIA B200', id: null }
    };
  }

  let cheapest = { ...defaultCheapest, price: Infinity };
  const gpuCounts = {};
  let mostPopular = { ...defaultMostPopular };

  gpuData.forEach((item) => {
    if (item.price_per_hour < cheapest.price) {
      cheapest = {
        provider: item.provider_name,
        gpu: item.gpu_model_name,
        price: item.price_per_hour,
        provider_id: item.provider_id,
        gpu_model_id: item.gpu_model_id
      };
    }

    gpuCounts[item.gpu_model_name] = (gpuCounts[item.gpu_model_name] || 0) + 1;
    if (!mostPopular.id || gpuCounts[item.gpu_model_name] > (gpuCounts[mostPopular.name] || 0)) {
      mostPopular = {
        name: item.gpu_model_name,
        id: item.gpu_model_id
      };
    }
  });

  const topB200Entry = gpuData.find((item) => normalizeB200Name(item.gpu_model_name));

  return {
    cheapest,
    mostPopular,
    topLine: {
      name: 'NVIDIA B200',
      id: topB200Entry?.gpu_model_id ?? null
    }
  };
};

export default function TopPicksSection() {
  const { gpuData, loading, error } = useGPUData({ ignoreContext: true });

  const picks = useMemo(() => deriveTopPicks(gpuData), [gpuData]);

  return (
    <div className="space-y-4">
      <Superlatives gpuData={gpuData} loading={loading} error={error} picks={picks} />
      <TopPickTrends picks={picks} loading={loading} />
    </div>
  );
}
