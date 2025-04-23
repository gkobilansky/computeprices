'use client';

import { useState, useEffect } from 'react';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import { useFilter } from '@/lib/context/FilterContext';

export function useGPUData({ ignoreContext = false, initialData = null } = {}) {
  const [gpuData, setGpuData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const { selectedProvider, selectedGPU } = useFilter();

  useEffect(() => {
    if (initialData) {
      // If we have initial data, only fetch when filters change
      if (ignoreContext || (!selectedProvider && !selectedGPU)) {
        return;
      }
    }
    fetchData();
  }, [ignoreContext ? null : selectedProvider, ignoreContext ? null : selectedGPU]);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await fetchGPUPrices({ 
        selectedProvider: ignoreContext ? null : selectedProvider?.id, 
        selectedGPU: ignoreContext ? null : selectedGPU?.id 
      });
      setGpuData(data);
    } catch (error) {
      console.error('Error fetching GPU data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  return {
    gpuData,
    loading,
    error,
    refetch: fetchData
  };
} 