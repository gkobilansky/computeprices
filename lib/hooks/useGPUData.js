'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import { useFilter } from '@/lib/context/FilterContext';

export function useGPUData({ ignoreContext = false, initialData = null } = {}) {
  const [gpuData, setGpuData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const { selectedProvider, selectedGPU } = useFilter();
  const providerId = ignoreContext ? null : selectedProvider?.id ?? null;
  const gpuId = ignoreContext ? null : selectedGPU?.id ?? null;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGPUPrices({ 
        selectedProvider: providerId, 
        selectedGPU: gpuId 
      });
      setGpuData(data);
    } catch (error) {
      console.error('Error fetching GPU data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [gpuId, providerId]);

  useEffect(() => {
    if (initialData && (ignoreContext || (!providerId && !gpuId))) {
      return;
    }

    fetchData();
  }, [fetchData, gpuId, ignoreContext, initialData, providerId]);

  return {
    gpuData,
    loading,
    error,
    refetch: fetchData
  };
} 
